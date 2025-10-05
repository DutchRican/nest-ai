import express from 'express';
import next from 'next';
import { parse } from 'url';
import { WebSocketServer } from 'ws';

const port = 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = express();
const server = app.listen(port, () => {
	console.log(`Server is listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV}`);
});
const nextApp = next({ dev });
const wss = new WebSocketServer({ noServer: true });

nextApp.prepare().then(() => {
	app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
		nextApp.getRequestHandler()(req, res, parse(req.url || "/", true));
	});

	wss.on('connection', (ws) => {
		let abortController: AbortController | null = null;
		ws.on('message', async (raw) => {
			let parsed;
			try {
				parsed = JSON.parse(raw.toString());
			} catch {
				// Accept plain text from client if they sent that
				parsed = { history: [{ role: 'user', content: raw.toString() }] };
			}

			const { history } = parsed;
			if (history?.[0].content === '[ABORT]') {
				if (abortController) {
					abortController.abort();
					abortController = null;
				}
			}

			const ollamaPayload: { model: string, messages: any[], stream: boolean, signal?: AbortSignal } = {
				model: 'gemma3',
				messages: history,
				stream: true,
			};
			abortController = new AbortController();

			try {
				const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(ollamaPayload),
					signal: abortController.signal
				});
				if (!ollamaResponse.ok) throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);

				const reader = ollamaResponse.body!.getReader();
				const decoder = new TextDecoder();

				while (true) {
					const { value } = await reader.read();
					const chunk = decoder.decode(value);
					try {
						const { done, message } = JSON.parse(chunk);
						if (done) break;
						if (message) ws.send(JSON.stringify(message));
					} catch (e) {
						// Forward raw chunk if not JSON
						ws.send(chunk);
					}
				}
				ws.send(JSON.stringify({ content: '[DONE]', role: 'assistant' }))
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					console.log('Ollama API request aborted by client.');
					return;
				}
				console.error('Error communicating with Ollama API:', error);
				try {
					ws.send(JSON.stringify({ role: 'error', content: 'Error communicating with Ollama API' }));
				} catch (sendErr) {
					console.error('Failed to send error to client:', sendErr);
				}
			}
		});

		ws.on('close', () => {
			console.log('Client disconnected, closing temporary wss');
		});
	});

	server.on('upgrade', (req, socket, head) => {
		const { pathname } = parse(req.url || "/", true);
		if (pathname === '/_next/webpack-hrm') {

			nextApp.getUpgradeHandler()(req, socket, head)
		}

		if (pathname == '/api/websocket') {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			})
		}
	});

});




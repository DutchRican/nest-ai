import { WebSocketServer } from 'ws';

const globalForWS = globalThis as unknown as {
	wss: WebSocketServer | undefined;
};

export const getWebSocketServer = () => {
	if (!globalForWS.wss) {
		globalForWS.wss = new WebSocketServer({ noServer: true });
	}
	return globalForWS.wss;
}
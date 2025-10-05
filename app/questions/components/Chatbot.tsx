'use client';
import BouncingDots from "@/app/components/bouncingDots";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "./hooks/useSocket";


export default function Chatbot() {
	const [messages, setMessages] = useState<{ role: string, content: string, id: string }[]>([]);
	const [input, setInput] = useState<string>("");
	const lastVisibleRef = useRef<HTMLDivElement | null>(null);
	const abortController = useRef<AbortController | null>(null);

	const { connectionStatus, currentMessage, isDone, isSubmitting, lastMessage, sendMessage } = useSocket();

	useEffect(() => {
		if (isDone) {
			setMessages((prevMessages) => [...prevMessages, { role: "assistant", content: lastMessage, id: window.crypto.randomUUID() }]);
		}
	}, [isDone, lastMessage, currentMessage]);

	useEffect(() => {
		if (lastVisibleRef.current) {
			lastVisibleRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
		}
	}, [messages, currentMessage]);


	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (connectionStatus === "open" && input.trim().length) {
			abortController.current = new AbortController();

			const newHistory = [...messages, { role: "user", content: input, id: window.crypto.randomUUID() }];
			setMessages(newHistory);
			sendMessage(newHistory);
			setInput("");
		}
	}

	const canSubmit = useMemo(() => {
		return connectionStatus === "open" && input.trim().length > 0 && !isSubmitting;
	}, [connectionStatus, input]);

	return (
		<div className="pt-4">
			<h1 className="text-center">Ollama Streaming Chat</h1>
			<div className="w-full max-w-2xl flex flex-col items-center p-4">
				<form id="chatForm" className="w-full flex items-center gap-2 py-4" onSubmit={handleSubmit}>
					<input type="text" id="promptInput" placeholder="Ask Ollama..." className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={input} onChange={(e) => setInput(e.target.value)} />
					<button
						type="submit"
						disabled={!canSubmit}
						className={` text-white px-4 py-2 rounded-lg0 focus:outline-none focus:ring-2 focus:ring-blue-500 
							${canSubmit ? "hover:bg-blue-600 bg-blue-500 focus:ring-2 focus:ring-blue-500" : "bg-blue-300"}
						`}>
						Send
					</button>
					<button
						type="button"
						id="abortButton"
						disabled={connectionStatus !== "open" || !currentMessage}
						onClick={() => { sendMessage([{ role: 'user', content: "[ABORT]" }]) }}
						className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500
						${connectionStatus !== "open" || !currentMessage
								? "bg-red-300 text-white"
								: "bg-red-500 text-white hover:bg-red-600"}`}>
						Abort
					</button>
				</form>
				<div className="p-4 border border-gray-300 w-full h-[450px]">
					<div id="chat-window" className="h-full overflow-y-auto p-4 flex flex-col gap-4 align-top">
						{messages.map((message, index) => {
							return (
								<div key={message.id} className={`p-3 rounded-lg max-w-3/4 whitespace-pre-wrap ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start'}`}>
									{message.content}
								</div>)
						})}
						{currentMessage && <div className="p-3 rounded-lg max-w-3/4 bg-gray-200 text-gray-800 self-start whitespace-pre-wrap">{currentMessage}</div>}
						{isSubmitting && !currentMessage && (
							<BouncingDots />
						)}
						<div ref={lastVisibleRef}></div>
					</div>
				</div>
			</div>
		</div>
	);
}

import { useEffect, useRef, useState } from "react";

export const useSocket = () => {
	const wsRef = useRef<WebSocket | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<'open' | 'closed' | 'connecting'>('connecting');
	const [currentMessage, setCurrentMessage] = useState('');
	const [lastMessage, setLastMessage] = useState('');
	const [isDone, setIsDone] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isAbortingRef = useRef(false);




	useEffect(() => {
		const socket = new WebSocket('ws://localhost:3000/api/websocket');
		socket.onopen = () => {
			setConnectionStatus('open')
			wsRef.current = socket
		};

		socket.onerror = (error) => {
			setConnectionStatus('closed');
			setIsDone(true);
			setIsSubmitting(false);
			console.error('WebSocket error:', error);
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.content === '[DONE]') {
				setIsDone(true);
				setIsSubmitting(false);
				setCurrentMessage((prev) => {
					setLastMessage(prev);
					return '';
				});
				return;
			}
			if (isAbortingRef.current) return;
			setCurrentMessage((prev) => prev + data.content);
		}

		socket.onclose = () => {
			setConnectionStatus("closed");
			setIsDone(true);
			setIsSubmitting(false);
			wsRef.current = null;
		};

		return () => {
			socket.close();
		};
	}, []);

	const sendMessage = (messages: { role: string, content: string }[]) => {
		if (wsRef.current?.readyState !== WebSocket.OPEN && messages.length) return;
		if (messages?.[0].content == '[ABORT]') {
			isAbortingRef.current = true;
			setCurrentMessage((m) => `${m}\n ..aborted.. \n`);
		} else {
			setCurrentMessage('');
			isAbortingRef.current = false;
		}
		setLastMessage('');
		setIsDone(false);
		setIsSubmitting(true);
		wsRef.current!.send(JSON.stringify({ history: messages }));
	}
	return { isDone, connectionStatus, currentMessage, lastMessage, sendMessage, isSubmitting }
}
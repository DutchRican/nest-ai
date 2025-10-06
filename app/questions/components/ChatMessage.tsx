const ChatMessage = ({ message }: { message: { role: string, content: string } }) => {
	const classNames = message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start';
	return (
		<div className={`p-3 rounded-lg max-w-3/4 whitespace-pre-wrap ${classNames}`}>
			{message.content}
		</div>
	)
}

export default ChatMessage;
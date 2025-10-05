export default function BouncingDots() {
	return (
		<div className="p-3 rounded-lg max-w-3/4 bg-gray-200 text-gray-800 self-start flex items-center">
			<span className="dot-bounce mx-1 bg-gray-500 rounded-full w-2 h-2 inline-block animate-bounce" style={{ animationDelay: "0s" }}></span>
			<span className="dot-bounce mx-1 bg-gray-500 rounded-full w-2 h-2 inline-block animate-bounce" style={{ animationDelay: "0.2s" }}></span>
			<span className="dot-bounce mx-1 bg-gray-500 rounded-full w-2 h-2 inline-block animate-bounce" style={{ animationDelay: "0.4s" }}></span>
			<style jsx>{`
									@keyframes bounce {
										0%, 80%, 100% { transform: translateY(0); }
										40% { transform: translateY(-8px); }
									}
									.dot-bounce {
										animation: bounce 1.2s infinite;
									}
								`}</style>
		</div>
	)
}
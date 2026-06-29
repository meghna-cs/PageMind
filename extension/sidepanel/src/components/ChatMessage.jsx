// ChatMessage.jsx — Individual chat message with markdown rendering

function renderMarkdown(text) {
  // Simple markdown: bold, bullets, code
  return text
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^• (.+)$/gm, "<li>$1</li>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-ai"}`}>
      {!isUser && (
        <div className="message-avatar">
          <span>🧠</span>
        </div>
      )}
      <div className={`message-bubble ${isUser ? "bubble-user" : "bubble-ai"}`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{
              __html: `<p>${renderMarkdown(message.content)}</p>`,
            }}
          />
        )}
        {isStreaming && !isUser && (
          <span className="cursor-blink">▋</span>
        )}
      </div>
      {isUser && (
        <div className="message-avatar avatar-user">
          <span>👤</span>
        </div>
      )}
    </div>
  );
}

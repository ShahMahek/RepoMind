'use client';

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/^---+$/gm, '<hr style="border-color:#30363d;margin:8px 0"/>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex fade-in ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-md bg-brand-green flex items-center
          justify-center mr-2 mt-0.5 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
              2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
              0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
              0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
              .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82
              .44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
              0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
              0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38
              A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-green text-white rounded-tr-sm'
            : 'bg-brand-darkGray border border-brand-border text-brand-text rounded-tl-sm markdown-body'
          }`}
        dangerouslySetInnerHTML={
          isUser
            ? undefined
            : { __html: renderMarkdown(message.content) }
        }
      >
        {isUser ? message.content : undefined}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-md bg-brand-medGray border border-brand-border
          flex items-center justify-center ml-2 mt-0.5 flex-shrink-0">
          <span className="text-brand-textMuted text-xs">U</span>
        </div>
      )}
    </div>
  );
}
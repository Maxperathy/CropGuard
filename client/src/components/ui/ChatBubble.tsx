import React from 'react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  audioElement?: React.ReactNode;
}

export function ChatBubble({ role, children, audioElement }: ChatBubbleProps) {
  const isUser = role === 'user';

  const formatContent = (content: React.ReactNode) => {
    if (typeof content !== 'string') return content;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      // Headings (e.g. ### 📋 Disease Details)
      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
        const title = trimmed.replace(/^#+\s*/, '');
        return (
          <h4 key={idx} className="font-extrabold text-zinc-900 mt-4 mb-2 text-[10px] uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200/80 pb-1">
            {title}
          </h4>
        );
      }

      // Bullets
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.replace(/^[\-\*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-2 py-0.5 text-zinc-750 font-medium">
            <span className="text-primary shrink-0 mt-1.5 w-1 h-1 rounded-full bg-primary" />
            <span className="flex-1">{itemText}</span>
          </div>
        );
      }

      // Inline bold parsing
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <p key={idx} className="mb-1.5 text-zinc-700 font-medium leading-relaxed">
            {parts.map((part, pIdx) => {
              if (pIdx % 2 !== 0) {
                return <strong key={pIdx} className="font-bold text-zinc-950">{part}</strong>;
              }
              return part;
            })}
          </p>
        );
      }

      return (
        <p key={idx} className="mb-1.5 text-zinc-700 font-medium leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-none shadow-sm'
            : 'bg-zinc-50 text-zinc-800 rounded-tl-none border border-zinc-250 shadow-sm'
        }`}
      >
        <div>{formatContent(children)}</div>
        {audioElement && <div className="mt-2">{audioElement}</div>}
      </div>
    </div>
  );
}

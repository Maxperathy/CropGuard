import React from 'react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  audioElement?: React.ReactNode;
}

export function ChatBubble({ role, children, audioElement }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/50'
        }`}
      >
        <div>{children}</div>
        {audioElement && <div className="mt-2">{audioElement}</div>}
      </div>
    </div>
  );
}

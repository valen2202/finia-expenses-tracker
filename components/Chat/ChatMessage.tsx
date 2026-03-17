'use client';

import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Sparkles } from 'lucide-react';

interface Props {
  message: ChatMessageType;
}

/** Renders **bold**, *italic*, and newlines from bot messages safely */
function RichText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part === '\n') return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  const time = new Date(message.timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[78%] bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
        <span className="text-[11px] text-gray-400 pr-1">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
          <RichText content={message.content} />
        </div>
        <span className="text-[11px] text-gray-400 pl-1">{time}</span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

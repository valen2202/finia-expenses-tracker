'use client';

import { ChatMessage as ChatMessageType } from '@/types/chat';
import { Bot, User } from 'lucide-react';

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
      <div className="flex items-end justify-end gap-2 group">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
          <span className="text-xs text-gray-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </span>
        </div>
        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mb-5">
          <User className="w-3.5 h-3.5 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 group">
      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mb-5 shadow-sm">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div className="bg-white border border-gray-100 text-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm">
          <RichText content={message.content} />
        </div>
        <span className="text-xs text-gray-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          FinIA · {time}
        </span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

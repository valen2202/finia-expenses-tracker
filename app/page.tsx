'use client';

import ChatWindow from '@/components/Chat/ChatWindow';
import LiveStats from '@/components/Dashboard/LiveStats';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
      {/* Chat panel */}
      <div className="flex-1 lg:flex-[3] min-w-0 min-h-0 flex flex-col -mx-4 sm:-mx-6 lg:mx-0">
        <ChatWindow />
      </div>

      {/* Stats panel — desktop only */}
      <div className="hidden lg:flex lg:flex-[2] min-w-0 flex-col overflow-y-auto">
        <LiveStats />
      </div>
    </div>
  );
}

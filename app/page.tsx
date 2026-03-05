'use client';

import ChatWindow from '@/components/Chat/ChatWindow';
import LiveStats from '@/components/Dashboard/LiveStats';

export default function HomePage() {
  return (
    <div className="flex-1 flex gap-5 min-h-0 h-[calc(100vh-5.5rem)]">
      {/* Chat panel — 60% */}
      <div className="flex-[3] min-w-0 flex flex-col">
        <ChatWindow />
      </div>

      {/* Stats panel — 40% */}
      <div className="flex-[2] min-w-0 hidden lg:flex flex-col overflow-y-auto">
        <LiveStats />
      </div>
    </div>
  );
}

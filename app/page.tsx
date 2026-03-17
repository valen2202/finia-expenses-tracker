'use client';

import ChatWindow from '@/components/Chat/ChatWindow';
import MobileChatView from '@/components/Chat/MobileChatView';
import LiveStats from '@/components/Dashboard/LiveStats';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
      {/* Mobile chat — nueva interfaz premium (solo < md) */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col md:hidden -mx-4 sm:-mx-6 relative">
        <MobileChatView />
      </div>

      {/* Desktop chat — interfaz original (solo >= md) */}
      <div className="hidden md:flex md:flex-1 lg:flex-[3] min-w-0 min-h-0 flex-col">
        <ChatWindow />
      </div>

      {/* Stats panel — solo desktop */}
      <div className="hidden lg:flex lg:flex-[2] min-w-0 flex-col overflow-y-auto">
        <LiveStats />
      </div>
    </div>
  );
}

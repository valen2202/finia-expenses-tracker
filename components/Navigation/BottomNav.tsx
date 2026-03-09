'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, LayoutDashboard, History, Cloud } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const links = [
  { href: '/', label: 'FinIA', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/historial', label: 'Historial', icon: History },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { openCloudHub } = useAppContext();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch h-16">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-indigo-600' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </Link>
          );
        })}

        <button
          onClick={openCloudHub}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Cloud className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Exportar</span>
        </button>
      </div>
    </nav>
  );
}

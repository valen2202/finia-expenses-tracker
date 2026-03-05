'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, History } from 'lucide-react';

const links = [
  { href: '/', label: 'FinIA', icon: MessageSquare },
  { href: '/historial', label: 'Historial', icon: History },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">IA</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 text-base leading-none block">FinIA</span>
              <span className="text-xs text-gray-400 leading-none">Asistente financiero</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

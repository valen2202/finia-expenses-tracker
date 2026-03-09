'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, History, Cloud, LayoutDashboard, LogOut } from 'lucide-react';
import CloudHubDrawer from '@/components/CloudHub/CloudHubDrawer';
import { useAppContext } from '@/context/AppContext';

const links = [
  { href: '/', label: 'FinIA', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/historial', label: 'Historial', icon: History },
];

export default function Navigation() {
  const pathname = usePathname();
  const { isCloudHubOpen, openCloudHub, closeCloudHub, user, signOut } = useAppContext();

  return (
    <>
      {/* Top nav — solo visible en sm+ */}
      <nav className="hidden sm:block bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
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

            {/* Links + Cloud Hub + User */}
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

              <div className="w-px h-5 bg-gray-200 mx-1" />

              <button
                onClick={openCloudHub}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 hover:from-indigo-100 hover:to-purple-100 transition-all shadow-sm"
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden sm:inline">Cloud Hub</span>
              </button>

              {user && (
                <>
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-indigo-700">
                        {user.email?.[0]?.toUpperCase() ?? 'U'}
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      title="Cerrar sesión"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Salir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isCloudHubOpen && <CloudHubDrawer onClose={closeCloudHub} />}
    </>
  );
}

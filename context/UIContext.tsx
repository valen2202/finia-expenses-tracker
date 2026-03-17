'use client';

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';

// S — Single Responsibility: este contexto solo maneja estado de UI
// que cruza límites de componentes (Cloud Hub drawer + dark mode).
export interface UIContextType {
  isCloudHubOpen: boolean;
  openCloudHub: () => void;
  closeCloudHub: () => void;
  isDark: boolean;
  toggleDark: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [isCloudHubOpen, setIsCloudHubOpen] = useState(false);
  const openCloudHub = useCallback(() => setIsCloudHubOpen(true), []);
  const closeCloudHub = useCallback(() => setIsCloudHubOpen(false), []);

  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage and apply class on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme_v1');
    const dark = stored === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('theme_v1', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <UIContext.Provider value={{ isCloudHubOpen, openCloudHub, closeCloudHub, isDark, toggleDark }}>
      {children}
    </UIContext.Provider>
  );
}

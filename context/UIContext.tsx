'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

// S — Single Responsibility: este contexto solo maneja estado de UI
// que cruza límites de componentes (Cloud Hub drawer).
export interface UIContextType {
  isCloudHubOpen: boolean;
  openCloudHub: () => void;
  closeCloudHub: () => void;
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

  return (
    <UIContext.Provider value={{ isCloudHubOpen, openCloudHub, closeCloudHub }}>
      {children}
    </UIContext.Provider>
  );
}

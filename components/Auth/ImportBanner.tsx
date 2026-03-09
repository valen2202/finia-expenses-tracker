'use client';

import { useAppContext } from '@/context/AppContext';
import { Upload, X } from 'lucide-react';

export default function ImportBanner() {
  const { pendingImport, importLocalData, dismissImport } = useAppContext();

  if (!pendingImport) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 py-2 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Upload className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium truncate">
              Encontramos datos locales. ¿Querés importarlos a tu cuenta?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={importLocalData}
              className="px-3 py-1.5 bg-white text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Importar
            </button>
            <button
              onClick={dismissImport}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

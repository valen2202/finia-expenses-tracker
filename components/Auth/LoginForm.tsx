'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'register' | 'forgot';

function mapError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials'))
    return 'Email o contraseña incorrectos.';
  if (message.includes('User already registered') || message.includes('already registered'))
    return 'Este email ya está registrado. Iniciá sesión.';
  if (message.includes('Password should be at least') || message.includes('at least 6'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed'))
    return 'Tu email no fue confirmado aún. Revisá tu casilla.';
  if (message.includes('rate limit') || message.includes('too many'))
    return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
  if (message.includes('Invalid email') || message.includes('valid email'))
    return 'Ingresá un email válido.';
  if (
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('network')
  )
    return 'Sin conexión. Verificá tu internet e intentá de nuevo.';
  return 'Ocurrió un error. Intentá de nuevo.';
}

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg('¡Cuenta creada! Revisá tu email para confirmar tu cuenta.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        setSuccessMsg('Te enviamos un email para restablecer tu contraseña.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al autenticarse';
      setError(mapError(message));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">IA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FinIA</h1>
          <p className="text-sm text-gray-500 mt-1">Asistente financiero personal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {mode === 'login'
              ? 'Iniciar sesión'
              : mode === 'register'
              ? 'Crear cuenta'
              : 'Restablecer contraseña'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-sm text-emerald-700">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
            >
              {loading
                ? 'Cargando…'
                : mode === 'login'
                ? 'Iniciar sesión'
                : mode === 'register'
                ? 'Crear cuenta'
                : 'Enviar email'}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            {mode === 'forgot' ? (
              <p className="text-sm text-gray-500">
                <button
                  onClick={() => switchMode('login')}
                  className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  ← Volver al inicio de sesión
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-1.5 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  {mode === 'login' ? 'Registrarse' : 'Iniciar sesión'}
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Tus datos se guardan de forma segura y privada.
        </p>
      </div>
    </div>
  );
}

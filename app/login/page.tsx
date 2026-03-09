import type { Metadata } from 'next';
import LoginForm from '@/components/Auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión — FinIA',
};

export default function LoginPage() {
  return <LoginForm />;
}

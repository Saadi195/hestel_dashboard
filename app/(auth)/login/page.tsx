import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to access the Hostel Management System.',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md space-y-6">
        <LoginForm />
        <p className="text-muted-foreground text-center text-xs">
          Hostel Management System &copy; {new Date().getFullYear()} — Multi-Hostel Operational Platform
        </p>
      </div>
    </main>
  );
}

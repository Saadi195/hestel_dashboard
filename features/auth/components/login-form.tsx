'use client';

import { Mail, Lock, LogIn, Shield, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { signIn } from '../actions';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState('owner@hostel.com');
  const [password, setPassword] = React.useState('Password123!');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await signIn(formData);
      if (res && !res.success) {
        setErrorMsg(res.error?.message ?? 'Invalid email or password.');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <Card className="w-full shadow-xl border-primary/20 bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 text-center pb-4">
        <div className="mx-auto bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-2 text-primary">
          <Building2 className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-extrabold tracking-tight">
          Hostel Admin Portal
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter your owner credentials to sign in to the management system
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {errorMsg && (
          <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="owner@hostel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full font-semibold" size="lg" disabled={loading}>
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <div className="p-3 text-xs bg-primary/10 text-primary rounded-lg border border-primary/20 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-foreground">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Owner Sign In Credentials
          </p>
          <div className="flex flex-col text-[11px] font-mono text-muted-foreground pt-0.5 space-y-0.5">
            <span>Email: <strong className="text-foreground">owner@hostel.com</strong></span>
            <span>Password: <strong className="text-foreground">Password123!</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


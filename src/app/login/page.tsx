
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api/http';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, token, loading } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && token) {
      router.replace('/dashboard');
    }
  }, [loading, token, router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!username || !password) {
      setErrorMessage('Please provide both username and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await login(username, password);
      toast({
        title: 'Login successful',
        description: 'Welcome back to your wallet.',
      });
      router.replace('/dashboard');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message || 'Incorrect username or password.'
          : 'Unable to login. Please try again.';
      setErrorMessage(message);
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="mb-4 justify-center" href="#" />
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" />
                <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
              </div>
              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Login'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

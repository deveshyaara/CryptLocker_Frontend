
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

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, token, loading } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && token) {
      router.replace('/dashboard');
    }
  }, [loading, token, router]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirm-password') ?? '');
    const fullName = String(formData.get('full-name') ?? '').trim();

    if (!username || !email || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await register({
        username,
        email,
        password,
        full_name: fullName || undefined,
      });
      toast({
        title: 'Wallet created successfully!',
        description: 'Welcome to CryptLocker.',
      });
      router.replace('/dashboard');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message || 'Unable to create account.'
          : 'Registration failed. Please try again later.';
      setErrorMessage(message);
      toast({
        title: 'Registration failed',
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
          <CardTitle className="font-headline text-2xl">Create Your Wallet</CardTitle>
          <CardDescription>Start managing your digital identity securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="john.doe"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" name="full-name" placeholder="John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" required />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Accept terms and conditions
                  </label>
                  <p className="text-sm text-muted-foreground">
                    You agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
              {errorMessage ? (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

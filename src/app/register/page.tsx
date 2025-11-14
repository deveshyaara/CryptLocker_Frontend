
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api/http';
import { useAuth } from '@/context/auth-context';
import type { ApiService } from '@/lib/api/config';
import type { UserRole } from '@/types/api';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, token, loading } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('holder');

  const resolveServiceForRole = React.useCallback((role: UserRole): ApiService => {
    switch (role) {
      case 'issuer':
        return 'issuer';
      case 'verifier':
        return 'verifier';
      default:
        return 'holder';
    }
  }, []);

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
      const service = resolveServiceForRole(selectedRole);

      console.log('Registering user with service:', service, 'Role:', selectedRole);
      
      // Register with backend API
      const response = await register({
        username,
        email,
        password,
        full_name: fullName || undefined,
        role: selectedRole,
      }, service);
      
      console.log('Registration successful:', response);
      
      // Also save to local database for file uploads and stats
      try {
        const dbResponse = await fetch('/api/db/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            password, // Will be hashed on server
            full_name: fullName || undefined,
            role: selectedRole,
          }),
        });

        if (dbResponse.ok) {
          const dbResult = await dbResponse.json();
          console.log('User saved to local database:', dbResult);
          
          // Note: User sync happens automatically after login in auth-context
        }
      } catch (dbError) {
        console.warn('Failed to save to local database (non-critical):', dbError);
        // Non-critical - backend API is primary
      }
      
      toast({
        title: 'Wallet created successfully!',
        description: 'Your account has been created and saved to the database. Welcome to CryptLocker!',
      });
      
      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 500));
      router.replace('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      
      let message = 'Registration failed. Please try again later.';
      
      if (error instanceof ApiError) {
        if (error.status === 0) {
          message = 'Cannot connect to the server. Please ensure the backend API is running and connected to a database.';
        } else if (error.status === 400) {
          message = error.message || 'Invalid registration data. Please check your information.';
        } else if (error.status === 409) {
          message = 'Username or email already exists. Please choose a different one.';
        } else if (error.status === 500) {
          message = 'Server error. The database may not be configured. Please contact support.';
        } else {
          message = error.message || `Registration failed (Error ${error.status}).`;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
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
                <Label htmlFor="role">Account Type</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holder">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Holder</span>
                        <span className="text-xs text-muted-foreground">Manage and store credentials</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="issuer">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Issuer</span>
                        <span className="text-xs text-muted-foreground">Issue credentials to holders</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="verifier">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Verifier</span>
                        <span className="text-xs text-muted-foreground">Request and verify proofs</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Admin</span>
                        <span className="text-xs text-muted-foreground">Full system access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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

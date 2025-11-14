import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { ApiErrorBoundary } from '@/components/common/api-error-boundary';
import { ApiConnectionStatus } from '@/components/common/api-connection-status';

export const metadata: Metadata = {
  title: 'CryptLocker',
  description: 'Your Secure Decentralized Web Wallet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ApiErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ApiErrorBoundary>
        <ApiConnectionStatus />
        <Toaster />
      </body>
    </html>
  );
}

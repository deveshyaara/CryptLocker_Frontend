import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Logo({ className, href = "/" }: { className?: string, href?: string }) {
  return (
    <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
      <div className={cn('flex items-center gap-2', className)}>
        <Lock className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold font-headline text-foreground tracking-tight">
          CryptLocker
        </h1>
      </div>
    </Link>
  );
}

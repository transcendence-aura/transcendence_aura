import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { AuthSideBanner } from '@/components/auth/AuthSideBanner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Top Navigation */}
      <nav className="border-border-default relative flex h-14 items-center justify-center border-b px-8">
        {/* Back to shop link*/}
        <Link
          href="/catalogue"
          className="text-text-muted hover:text-text-primary absolute left-8 flex items-center gap-1.5 text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to shop</span>
        </Link>

        {/*logo */}
        <Link href="/" className="font-cormorant text-text-primary text-xl tracking-widest">
          Aura
        </Link>
      </nav>

      {/* Main Layout */}
      <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 md:grid-cols-2">
        {/* Left side: Brand Banner (only on desktop) */}
        <div className="hidden md:block">
          <AuthSideBanner />
        </div>

        {/* Right side: Form */}
        <main className="border-border-default flex flex-col justify-center border-l px-8 py-12 md:px-14">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

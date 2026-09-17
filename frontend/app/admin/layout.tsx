import Link from 'next/link';
import { Bell, User } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Badge } from '@/components/ui/display/badge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-page flex min-h-screen flex-col">
      <header className="bg-card border-border-default flex h-16 items-center justify-between border-b px-6 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-cormorant text-text-primary text-lg tracking-widest">Aura</span>
          <Badge variant="dark">Admin</Badge>
        </Link>

        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="bg-brand-dark text-text-inverse flex h-8 w-8 items-center justify-center rounded-full">
            <User className="h-4 w-4" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

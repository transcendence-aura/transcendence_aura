'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Shield,
  Package,
  Activity,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
}

const OVERVIEW: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Analytics', icon: TrendingUp },
];

const MANAGEMENT: NavItem[] = [
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Roles & Perms', icon: Shield },
  { label: 'Products', icon: Package },
];

const SYSTEM: NavItem[] = [{ label: 'Prometheus', icon: Activity, external: true }];

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div>
      <p className="text-ui-label text-text-muted mb-2 px-3 uppercase tracking-widest">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = item.href ? pathname.startsWith(item.href) : false;
          const Icon = item.icon;

          if (!item.href) {
            return (
              <li key={item.label}>
                <span className="text-body-sm text-text-muted/60 flex cursor-not-allowed items-center gap-2.5 px-3 py-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.external && <ExternalLink className="ml-auto h-3.5 w-3.5" />}
                </span>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`text-body-sm flex items-center gap-2.5 px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-page text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-page'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="border-border-default flex w-56 shrink-0 flex-col gap-6 border-r px-3 py-6">
      <NavSection label="Overview" items={OVERVIEW} />
      <NavSection label="Management" items={MANAGEMENT} />
      <NavSection label="System" items={SYSTEM} />
    </aside>
  );
}

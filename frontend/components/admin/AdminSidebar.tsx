'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { LayoutDashboard, TrendingUp, Users, Package, Activity, ExternalLink } from 'lucide-react';

interface NavItem {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
}

const OVERVIEW: NavItem[] = [
  { labelKey: 'dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { labelKey: 'analytics', icon: TrendingUp, href: '/admin/analytics' },
];

const MANAGEMENT: NavItem[] = [
  { labelKey: 'users', icon: Users, href: '/admin/users' },
  { labelKey: 'products', icon: Package, href: '/admin/products' },
];

const SYSTEM: NavItem[] = [{ labelKey: 'serviceStatus', icon: Activity, href: '/admin/health' }];

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const t = useTranslations('AdminSidebar');
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
              <li key={item.labelKey}>
                <span className="text-body-sm text-text-muted/60 flex cursor-not-allowed items-center gap-2.5 px-3 py-2">
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                  {item.external && <ExternalLink className="ms-auto h-3.5 w-3.5" />}
                </span>
              </li>
            );
          }

          return (
            <li key={item.labelKey}>
              <Link
                href={item.href}
                className={`text-body-sm flex items-center gap-2.5 px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-page text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-page'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AdminSidebar() {
  const t = useTranslations('AdminSidebar');

  return (
    <aside className="border-border-default flex w-56 shrink-0 flex-col gap-6 border-e px-3 py-6">
      <NavSection label={t('overview')} items={OVERVIEW} />
      <NavSection label={t('management')} items={MANAGEMENT} />
      <NavSection label={t('system')} items={SYSTEM} />
    </aside>
  );
}

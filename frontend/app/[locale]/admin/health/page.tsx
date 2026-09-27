import { gql, type TypedDocumentNode } from '@apollo/client';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Database, KeyRound, LayoutTemplate, Server, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getServerApolloClient } from '@/lib/apollo-server-client';

export const dynamic = 'force-dynamic';

const SERVICES = [
  { name: 'nginx', icon: ShieldCheck },
  { name: 'frontend', icon: LayoutTemplate },
  { name: 'backend', icon: Server },
  { name: 'database', icon: Database },
  { name: 'vault', icon: KeyRound },
] as const;
type ServiceName = (typeof SERVICES)[number]['name'];

interface ServiceResult {
  up: boolean;
  latencyMs: number | null;
}

interface HealthQueryData {
  health: {
    status: string;
    checkedAt: string;
    services: { name: string; up: boolean; latencyMs: number }[];
  };
}

const HEALTH_QUERY: TypedDocumentNode<HealthQueryData> = gql`
  query Health {
    health {
      status
      checkedAt
      services {
        name
        up
        latencyMs
      }
    }
  }
`;

async function fetchHealth(): Promise<{
  services: Record<ServiceName, ServiceResult>;
  checkedAt: Date;
}> {
  const down: ServiceResult = { up: false, latencyMs: null };
  const services: Record<ServiceName, ServiceResult> = {
    nginx: { up: true, latencyMs: null },
    frontend: { up: true, latencyMs: null },
    backend: down,
    database: down,
    vault: down,
  };

  try {
    const client = await getServerApolloClient();
    const { data } = await client.query({
      query: HEALTH_QUERY,
      fetchPolicy: 'no-cache',
    });
    for (const service of data?.health?.services ?? []) {
      if (service.name in services) {
        services[service.name as ServiceName] = { up: service.up, latencyMs: service.latencyMs };
      }
    }
    return { services, checkedAt: new Date(data?.health?.checkedAt ?? Date.now()) };
  } catch {
    // If Backend unreachable -> every service is reported as down.
    return { services, checkedAt: new Date() };
  }
}

export default async function HealthPage() {
  const t = await getTranslations('HealthPage');
  const format = await getFormatter();
  const { services, checkedAt } = await fetchHealth();
  const allUp = Object.values(services).every((service) => service.up);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Header */}
      <div className="text-center">
        <span className="text-ui-label uppercase tracking-widest text-brand-accent">
          {t('eyebrow')}
        </span>
        <h1 className="mt-4 font-cormorant text-4xl font-light text-text-primary md:text-6xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-body-base text-text-secondary">{t('subtitle')}</p>
      </div>

      {/* Overall status */}
      <div
        className={`mt-12 flex items-center justify-center gap-3 border px-6 py-5 ${
          allUp
            ? 'border-status-online/40 bg-status-online/5'
            : 'border-status-error/40 bg-status-error/5'
        }`}
      >
        <span className="relative flex h-3 w-3">
          {allUp && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-60" />
          )}
          <span
            className={`relative inline-flex h-3 w-3 rounded-full ${allUp ? 'bg-status-online' : 'bg-status-error'}`}
          />
        </span>
        <p className="text-body-base font-medium text-text-primary">
          {allUp ? t('allUp') : t('someDown')}
        </p>
      </div>

      {/* Services */}
      <ul className="mt-8 divide-y divide-border-default border-y border-border-default">
        {SERVICES.map(({ name, icon: Icon }) => {
          const { up, latencyMs } = services[name];
          return (
            <li key={name} className="flex items-center gap-5 py-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card-subtle">
                <Icon className="h-5 w-5 text-text-secondary" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-cormorant text-2xl text-text-primary">
                  {t(`services.${name}.name`)}
                </p>
                <p className="text-body-sm text-text-muted">{t(`services.${name}.description`)}</p>
              </div>
              <div className="shrink-0 text-end">
                <p
                  className={`flex items-center justify-end gap-2 text-ui-label uppercase tracking-wider ${
                    up ? 'text-status-online' : 'text-status-error'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${up ? 'bg-status-online' : 'bg-status-error'}`}
                  />
                  {up ? t('up') : t('down')}
                </p>
                {up && latencyMs !== null && name !== 'backend' && (
                  <p className="mt-1 text-body-sm text-text-muted" dir="ltr">
                    {t('latency', { ms: latencyMs })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 text-body-sm text-text-muted sm:flex-row">
        <p>{t('checkedAt', { time: format.dateTime(checkedAt, { timeStyle: 'medium' }) })}</p>
        <Link
          href="/admin/health"
          className="border-b border-border-default pb-0.5 text-ui-label uppercase tracking-wider text-text-primary transition-colors hover:border-brand-dark"
        >
          {t('refresh')}
        </Link>
      </div>
    </main>
  );
}

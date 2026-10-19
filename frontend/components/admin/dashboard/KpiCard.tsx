import { Skeleton } from '@/components/ui/feedback/skeleton';

// `value` left undefined means the metric has no backend source yet: the card
// keeps its place in the layout and says so instead of showing a made-up figure.
export function KpiCard({
  label,
  value,
  loading = false,
}: {
  label: string;
  value?: string;
  loading?: boolean;
}) {
  return (
    <div className="border-border-default bg-card border p-5">
      <p className="text-ui-label text-text-muted uppercase tracking-widest">{label}</p>

      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : value === undefined ? (
        <p className="text-body-base text-text-muted mt-3">Coming soon</p>
      ) : (
        <p className="font-cormorant text-display-stat text-text-primary mt-3">{value}</p>
      )}
    </div>
  );
}

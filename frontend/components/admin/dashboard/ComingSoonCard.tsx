// Same shell as ChartCard, for charts whose data does not exist in the backend yet.
export function ComingSoonCard({ title }: { title: string }) {
  return (
    <div className="border-border-default bg-card border p-6">
      <h2 className="text-display-subtitle mb-4 font-semibold">{title}</h2>
      <div className="flex h-[220px] items-center justify-center">
        <p className="text-body-base text-text-muted">Coming soon</p>
      </div>
    </div>
  );
}

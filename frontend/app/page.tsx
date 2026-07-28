export default function Home() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-display-hero text-text-primary mb-6">Aura</h1>

      <p className="text-body-lg text-text-secondary max-w-lg mb-8">
        Notre site est actuellement en construction. Nous travaillons dur pour vous offrir une
        expérience exceptionnelle.
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border-default"></div>
        </div>
      </div>
    </div>
  );
}

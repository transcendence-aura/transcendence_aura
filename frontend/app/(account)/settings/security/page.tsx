import { TwoFactorEnrollment } from '@/components/auth/TwoFactorEnrollment';

export default function SecurityPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Security</h1>

        <p className="mt-2 text-sm text-neutral-600">
          Manage the security settings for your account.
        </p>
      </div>

      <div className="mt-8">
        <TwoFactorEnrollment />
      </div>
    </main>
  );
}

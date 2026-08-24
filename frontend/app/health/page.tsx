import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

// This page queries a live backend; render it per request, not at build time.
export const dynamic = 'force-dynamic';

interface HealthQueryData {
  health: { status: string };
}

const HEALTH_QUERY = gql`
  query Health {
    health {
      status
    }
  }
`;

export default async function HealthPage() {
  const { data } = await apolloClient.query<HealthQueryData>({ query: HEALTH_QUERY });

  return (
    <main>
      <h1>Backend health</h1>
      <p>status: {data?.health?.status ?? 'unavailable'}</p>
    </main>
  );
}

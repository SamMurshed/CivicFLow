import KnowledgeBase from '@/components/support/KnowledgeBase';
import { requireRole } from '@/lib/auth/dal';

export default async function AgencyKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireRole('agency_user');
  const { search } = await searchParams;
  return <KnowledgeBase pagePath="/agency/knowledge" search={search} />;
}

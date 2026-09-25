import KnowledgeBase from '@/components/support/KnowledgeBase';
import { requireRole } from '@/lib/auth/dal';

export default async function VendorKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireRole('vendor');
  const { search } = await searchParams;
  return <KnowledgeBase pagePath="/vendor/knowledge" search={search} />;
}

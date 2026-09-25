import KnowledgeBase from '@/components/support/KnowledgeBase';
import { requireRole } from '@/lib/auth/dal';

export default async function AdminKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireRole('admin');
  const { search } = await searchParams;
  return <KnowledgeBase pagePath="/admin/knowledge" search={search} />;
}

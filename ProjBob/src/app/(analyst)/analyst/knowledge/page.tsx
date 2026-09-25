import KnowledgeBase from '@/components/support/KnowledgeBase';
import { requireRole } from '@/lib/auth/dal';

export default async function AnalystKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireRole('analyst');
  const { search } = await searchParams;
  return <KnowledgeBase pagePath="/analyst/knowledge" search={search} />;
}

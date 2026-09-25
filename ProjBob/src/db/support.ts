import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { FeedbackItem, KnowledgeArticle } from '@/types/database';

export async function getKnowledgeArticles(search?: string): Promise<KnowledgeArticle[]> {
  const supabase = await createClient();
  let query = supabase
    .from('knowledge_articles')
    .select('*')
    .eq('is_published', true)
    .order('title', { ascending: true });

  const normalized = search?.trim().replaceAll(',', ' ').slice(0, 100);
  if (normalized) {
    query = query.or(`title.ilike.%${normalized}%,body.ilike.%${normalized}%`);
  }
  const { data } = await query;
  return (data ?? []) as KnowledgeArticle[];
}

export interface FeedbackWithMeta extends FeedbackItem {
  submitter_name: string;
  article_title: string;
}

export async function getRecentFeedback(): Promise<FeedbackWithMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('feedback_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (!data?.length) return [];

  const profileIds = [
    ...new Set(data.flatMap((item) => (item.submitted_by ? [item.submitted_by] : []))),
  ];
  const articleIds = [
    ...new Set(data.flatMap((item) => (item.article_id ? [item.article_id] : []))),
  ];
  const [{ data: profiles }, { data: articles }] = await Promise.all([
    profileIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    articleIds.length
      ? supabase.from('knowledge_articles').select('id, title').in('id', articleIds)
      : Promise.resolve({ data: [] }),
  ]);
  const names = new Map(
    (profiles ?? []).map((profile: { id: string; full_name: string }) => [
      profile.id,
      profile.full_name,
    ]),
  );
  const titles = new Map(
    (articles ?? []).map((article: { id: string; title: string }) => [article.id, article.title]),
  );
  return data.map((item) => ({
    ...item,
    submitter_name: item.submitted_by
      ? (names.get(item.submitted_by) ?? 'Unknown user')
      : 'Anonymous',
    article_title: item.article_id
      ? (titles.get(item.article_id) ?? 'Unknown article')
      : 'Request feedback',
  })) as FeedbackWithMeta[];
}

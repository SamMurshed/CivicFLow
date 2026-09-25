'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { logEvent } from '@/lib/activity-log';
import type { ActionState } from '@/lib/vendor-profile-actions';

export const INITIAL_STATE: ActionState = { success: false, error: null, fieldErrors: {} };

const feedbackSchema = z.object({
  article_id: z.string().uuid('Invalid article.'),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000, 'Feedback must be 1000 characters or fewer.').nullable(),
});

export async function submitFeedback(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();
  const parsed = feedbackSchema.safeParse({
    article_id: formData.get('article_id'),
    rating: formData.get('rating'),
    comment: formData.get('comment') || null,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: 'Check the feedback form and try again.',
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    };
  }

  const supabase = await createClient();
  const { data: article } = await supabase
    .from('knowledge_articles')
    .select('id')
    .eq('id', parsed.data.article_id)
    .eq('is_published', true)
    .single();
  if (!article) return { success: false, error: 'Article not found.', fieldErrors: {} };

  const { data: recent } = await supabase
    .from('feedback_items')
    .select('created_at')
    .eq('submitted_by', user.id)
    .eq('article_id', parsed.data.article_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
    return {
      success: false,
      error: 'Please wait before submitting more feedback.',
      fieldErrors: {},
    };
  }

  const { error } = await supabase.from('feedback_items').insert({
    submitted_by: user.id,
    article_id: parsed.data.article_id,
    request_id: null,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });
  if (error) return { success: false, error: 'Unable to save feedback.', fieldErrors: {} };

  await logEvent({
    actor_id: user.id,
    event_type: 'knowledge.feedback_submitted',
    entity_type: 'knowledge_article',
    entity_id: parsed.data.article_id,
    metadata: { rating: parsed.data.rating },
  });
  revalidatePath('/admin/feedback');
  return { success: true, error: null, fieldErrors: {} };
}

import Link from 'next/link';
import { getKnowledgeArticles } from '@/db/support';
import { Button, EmptyState } from '@/components/ui';
import FeedbackForm from './FeedbackForm';

interface Props {
  search?: string;
  pagePath: string;
}

export default async function KnowledgeBase({ search, pagePath }: Props) {
  const articles = await getKnowledgeArticles(search);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-slate-500">
          Guides for procurement, grants, compliance, and disaster-recovery workflows.
        </p>
      </div>
      <form method="GET" action={pagePath} className="flex max-w-2xl gap-2">
        <label className="sr-only" htmlFor="knowledge-search">
          Search guidance
        </label>
        <input
          id="knowledge-search"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search guidance…"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
        {search && (
          <Link href={pagePath}>
            <Button variant="ghost" size="sm">
              Clear
            </Button>
          </Link>
        )}
      </form>
      {articles.length === 0 ? (
        <EmptyState title="No guidance found" description="Try a broader search term." />
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{article.title}</h2>
                {article.category && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {article.category}
                  </span>
                )}
              </div>
              <div className="mt-3 text-sm leading-6 whitespace-pre-line text-slate-700">
                {article.body}
              </div>
              {article.tags?.length ? (
                <p className="mt-3 text-xs text-slate-500">Tags: {article.tags.join(', ')}</p>
              ) : null}
              <FeedbackForm articleId={article.id} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

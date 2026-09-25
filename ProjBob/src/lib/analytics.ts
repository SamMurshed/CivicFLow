import type { RequestStatus } from '@/types/database';

export interface AnalyticsRequest {
  status: RequestStatus;
  submitted_at: string | null;
  decided_at: string | null;
  submission_deadline: string | null;
}

export interface MonthlyVolume {
  month: string;
  count: number;
}

export interface ReportingMetrics {
  total: number;
  byStatus: Partial<Record<RequestStatus, number>>;
  approvalRate: number;
  averageProcessingDays: number;
  overdue: number;
  monthlyVolume: MonthlyVolume[];
}

const TERMINAL_STATUSES: RequestStatus[] = ['approved', 'rejected', 'withdrawn'];

export function calculateReportingMetrics(
  requests: AnalyticsRequest[],
  now = new Date(),
): ReportingMetrics {
  const byStatus: Partial<Record<RequestStatus, number>> = {};
  for (const request of requests) {
    byStatus[request.status] = (byStatus[request.status] ?? 0) + 1;
  }

  const decided = requests.filter(
    (request) =>
      (request.status === 'approved' || request.status === 'rejected') && request.decided_at,
  );
  const approved = decided.filter((request) => request.status === 'approved').length;
  const processingDurations = decided
    .filter((request) => request.submitted_at && request.decided_at)
    .map(
      (request) =>
        (new Date(request.decided_at!).getTime() - new Date(request.submitted_at!).getTime()) /
        86_400_000,
    )
    .filter((days) => Number.isFinite(days) && days >= 0);

  const overdue = requests.filter(
    (request) =>
      request.submission_deadline &&
      new Date(request.submission_deadline).getTime() < now.getTime() &&
      !TERMINAL_STATUSES.includes(request.status),
  ).length;

  const monthCounts = new Map<string, number>();
  for (const request of requests) {
    if (!request.submitted_at) continue;
    const date = new Date(request.submitted_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  return {
    total: requests.length,
    byStatus,
    approvalRate: decided.length === 0 ? 0 : Math.round((approved / decided.length) * 100),
    averageProcessingDays:
      processingDurations.length === 0
        ? 0
        : Math.round(
            (processingDurations.reduce((sum, days) => sum + days, 0) /
              processingDurations.length) *
              10,
          ) / 10,
    overdue,
    monthlyVolume: [...monthCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-6)
      .map(([month, count]) => ({ month, count })),
  };
}

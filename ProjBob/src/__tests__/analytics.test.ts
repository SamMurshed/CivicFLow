import { describe, expect, it } from 'vitest';
import { calculateReportingMetrics } from '@/lib/analytics';
import { rowsToCsv, sanitizeSpreadsheetCell } from '@/lib/csv';

describe('calculateReportingMetrics', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const requests = [
    {
      status: 'approved' as const,
      submitted_at: '2026-08-01T00:00:00Z',
      decided_at: '2026-08-06T00:00:00Z',
      submission_deadline: '2026-08-20',
    },
    {
      status: 'rejected' as const,
      submitted_at: '2026-08-10T00:00:00Z',
      decided_at: '2026-08-13T00:00:00Z',
      submission_deadline: '2026-08-20',
    },
    {
      status: 'under_review' as const,
      submitted_at: '2026-09-01T00:00:00Z',
      decided_at: null,
      submission_deadline: '2026-09-10',
    },
  ];

  it('calculates outcomes, processing time, and overdue work', () => {
    const metrics = calculateReportingMetrics(requests, now);
    expect(metrics.total).toBe(3);
    expect(metrics.approvalRate).toBe(50);
    expect(metrics.averageProcessingDays).toBe(4);
    expect(metrics.overdue).toBe(1);
    expect(metrics.byStatus.approved).toBe(1);
  });

  it('groups monthly submission volume in order', () => {
    expect(calculateReportingMetrics(requests, now).monthlyVolume).toEqual([
      { month: '2026-08', count: 2 },
      { month: '2026-09', count: 1 },
    ]);
  });

  it('returns safe zero values for an empty dataset', () => {
    const metrics = calculateReportingMetrics([], now);
    expect(metrics.approvalRate).toBe(0);
    expect(metrics.averageProcessingDays).toBe(0);
    expect(metrics.monthlyVolume).toEqual([]);
  });
});

describe('CSV export security', () => {
  it('prefixes spreadsheet formulas', () => {
    expect(sanitizeSpreadsheetCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(sanitizeSpreadsheetCell('+1+1')).toBe('"\'+1+1"');
  });

  it('quotes commas, quotes, and newlines', () => {
    const csv = rowsToCsv(['Title'], [['A, "quoted"\nvalue']]);
    expect(csv).toContain('"A, ""quoted""\nvalue"');
  });
});

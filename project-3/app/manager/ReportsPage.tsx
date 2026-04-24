'use client';

import { useMemo, useState } from 'react';
import { authFetch } from '@/lib/fetch-utils';

type ReportPayload = {
  type: 'x' | 'z';
  report: {
    date: string;
    summary: {
      salesTotal: number;
      orderCount: number;
      returnTotal: number;
      returnCount: number;
    };
    hourly: Array<{
      hourOfDay: number;
      salesTotal: number;
      orderCount: number;
    }>;
  };
  hasSideEffects: boolean;
  message: string;
  resetPerformed?: boolean;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const today = useMemo(() => toIsoDate(new Date()), []);
  const [targetDate, setTargetDate] = useState(today);
  const [isXLoading, setIsXLoading] = useState(false);
  const [isZLoading, setIsZLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);

  async function runXReport() {
    setIsXLoading(true);
    setError(null);
    setNotice(null);

    try {
      const params = new URLSearchParams({ type: 'x', date: targetDate });
      const response = await authFetch(`/api/manager/reports?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate X-report.');
      }

      setReport(data as ReportPayload);
      setNotice('X-report generated. No values were reset.');
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : 'Failed to generate X-report.'
      );
    } finally {
      setIsXLoading(false);
    }
  }

  async function runZReport() {
    const confirmed = window.confirm(
      'Run Z-report for this date? This should only be done once per day and will reset daily running totals.'
    );

    if (!confirmed) {
      return;
    }

    setIsZLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await authFetch('/api/manager/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'z', date: targetDate }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run Z-report.');
      }

      setReport(data as ReportPayload);
      setNotice('Z-report generated and daily running totals were reset.');
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : 'Failed to run Z-report.'
      );
    } finally {
      setIsZLoading(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="border-b border-[#dbe4d6] pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
            Reports
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
            X and Z closing reports
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#586756]">
            X-report is read-only and can be run anytime. Z-report is a day-end
            closeout operation and can only run once per date.
          </p>
        </div>

        <div className="grid gap-4 rounded-[24px] border border-[#d9e3d5] bg-white p-5 lg:grid-cols-[1fr_auto_auto]">
          <label className="text-sm font-semibold text-[#556253]">
            Report date
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="mt-2 block w-full rounded-[12px] border border-[#cfd9ca] px-4 py-3 text-base font-medium text-[#223020] outline-none focus:border-[#6a8e67] focus:ring-4 focus:ring-[#dbe7d7]"
            />
          </label>

          <button
            type="button"
            onClick={runXReport}
            disabled={isXLoading || isZLoading}
            className="rounded-[12px] border border-[#5f855c] bg-[#6a8e67] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#597b56] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isXLoading ? 'Running X...' : 'Run X-Report'}
          </button>

          <button
            type="button"
            onClick={runZReport}
            disabled={isXLoading || isZLoading}
            className="rounded-[12px] border border-[#a8685f] bg-[#b7756b] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#a5665d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isZLoading ? 'Running Z...' : 'Run Z-Report'}
          </button>
        </div>

        {error ? (
          <div className="rounded-[18px] border border-[#e7b8b2] bg-[#fff1ef] px-5 py-4 text-sm font-semibold text-[#97463c]">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-[18px] border border-[#cfe3cc] bg-[#eef8ec] px-5 py-4 text-sm font-semibold text-[#2f6d2a]">
            {notice}
          </div>
        ) : null}

        {report ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Sales
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {currencyFormatter.format(report.report.summary.salesTotal)}
                </p>
              </article>
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Orders
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {report.report.summary.orderCount}
                </p>
              </article>
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Returns
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {currencyFormatter.format(report.report.summary.returnTotal)}
                </p>
                <p className="mt-1 text-xs text-[#607061]">
                  {report.report.summary.returnCount} return rows
                </p>
              </article>
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Return Count
                </p>
                <p className="mt-3 text-3xl font-bold">
                  {report.report.summary.returnCount}
                </p>
              </article>
            </div>

            <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
              <h3 className="text-xl font-semibold">Hourly Activity</h3>
              <p className="mt-1 text-sm text-[#607061]">
                Sales and order counts by hour for {report.report.date}.
              </p>
              {report.report.hourly.length > 0 ? (
                <ul className="mt-5 max-h-64 space-y-2 overflow-auto pr-1">
                  {report.report.hourly.map((row) => (
                    <li
                      key={row.hourOfDay}
                      className="flex items-center justify-between rounded-[12px] border border-[#e4ece0] bg-[#fbfdfb] px-4 py-2"
                    >
                      <span className="text-sm font-medium">
                        {row.hourOfDay.toString().padStart(2, '0')}:00
                      </span>
                      <span className="text-sm font-semibold text-[#2f7a5f]">
                        {currencyFormatter.format(row.salesTotal)} / {row.orderCount}{' '}
                        orders
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[#607061]">No hourly rows for this day.</p>
              )}
            </article>

          </div>
        ) : null}
      </div>
    </section>
  );
}

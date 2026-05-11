import type { StudySession } from '../session/session.types.js';
import type { DueReview, ReviewUrgency, ScheduledReview } from './reviews.types.js';

const REVIEW_INTERVALS: Array<[maxScore: number, days: number]> = [
  [3, 1],
  [5, 3],
  [6, 7],
  [Infinity, 14],
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function determineUrgency(score: number): ReviewUrgency {
  if (score <= 3) return 'high';
  if (score <= 5) return 'medium';
  return 'low';
}

function calculateNextReviewDate(score: number, lastDate: string): string {
  const interval = REVIEW_INTERVALS.find(([max]) => score <= max)![1];
  const d = new Date(lastDate);
  d.setDate(d.getDate() + interval);
  return d.toISOString().slice(0, 10);
}

function buildLatestByTheme(sessions: StudySession[]): Record<string, { score: number; date: string }> {
  const latest: Record<string, { score: number; date: string }> = {};
  for (const s of sessions) {
    if (s.score === null) continue;
    if (!latest[s.theme] || s.createdAt > latest[s.theme].date) {
      latest[s.theme] = { score: s.score, date: s.createdAt };
    }
  }
  return latest;
}

export function buildDueReviews(sessions: StudySession[]): DueReview[] {
  const today = todayISO();
  const latest = buildLatestByTheme(sessions);
  const due: DueReview[] = [];

  for (const [theme, data] of Object.entries(latest)) {
    const dueDate = calculateNextReviewDate(data.score, data.date);
    if (dueDate > today) continue;
    const daysOverdue = Math.floor(
      (new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000
    );
    due.push({ theme, lastScore: data.score, lastDate: data.date, dueDate, daysOverdue, urgency: determineUrgency(data.score) });
  }

  return due.sort((a, b) => b.daysOverdue - a.daysOverdue || a.lastScore - b.lastScore);
}

export function buildReviewSchedule(sessions: StudySession[]): ScheduledReview[] {
  const latest = buildLatestByTheme(sessions);
  return Object.entries(latest)
    .map(([theme, data]) => ({
      theme,
      lastScore: data.score,
      lastDate: data.date,
      nextReview: calculateNextReviewDate(data.score, data.date),
      urgency: determineUrgency(data.score),
    }))
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview));
}

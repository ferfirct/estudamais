import type { StudySession } from '../session/session.types.js';
import { calculateEfficiencyIndex } from '../session/session.domain.js';
import type { ThemeRecord, ThemeRecordDetail } from './records.types.js';

const GOOD_SCORE_THRESHOLD = 7;

interface ThemeAccumulator {
  theme: string;
  bestEfficiency: number;
  bestScore: number;
  shortestTimeForGoodScore: number | null;
  recordDate: string;
  sessionsCount: number;
  scoreSum: number;
}

function buildAccumulators(sessions: StudySession[]): Record<string, ThemeAccumulator> {
  const accumulators: Record<string, ThemeAccumulator> = {};

  for (const s of sessions) {
    if (s.score === null) continue;
    const efficiency = calculateEfficiencyIndex(s.score, s.durationMinutes);

    if (!accumulators[s.theme]) {
      accumulators[s.theme] = {
        theme: s.theme,
        bestEfficiency: efficiency,
        bestScore: s.score,
        shortestTimeForGoodScore: s.score >= GOOD_SCORE_THRESHOLD ? s.durationMinutes : null,
        recordDate: s.createdAt,
        sessionsCount: 0,
        scoreSum: 0,
      };
    }

    const acc = accumulators[s.theme];
    acc.sessionsCount++;
    acc.scoreSum += s.score;

    if (efficiency > acc.bestEfficiency) {
      acc.bestEfficiency = efficiency;
      acc.recordDate = s.createdAt;
    }
    if (s.score > acc.bestScore) acc.bestScore = s.score;
    if (s.score >= GOOD_SCORE_THRESHOLD) {
      if (acc.shortestTimeForGoodScore === null || s.durationMinutes < acc.shortestTimeForGoodScore) {
        acc.shortestTimeForGoodScore = s.durationMinutes;
      }
    }
  }

  return accumulators;
}

function toThemeRecord(acc: ThemeAccumulator): ThemeRecord {
  return {
    theme: acc.theme,
    bestEfficiency: acc.bestEfficiency,
    bestScore: acc.bestScore,
    shortestTimeForGoodScore: acc.shortestTimeForGoodScore,
    recordDate: acc.recordDate,
    sessionsCount: acc.sessionsCount,
    avgScore: acc.sessionsCount > 0 ? Number((acc.scoreSum / acc.sessionsCount).toFixed(2)) : 0,
  };
}

export function buildAllRecords(sessions: StudySession[]): ThemeRecord[] {
  return Object.values(buildAccumulators(sessions)).map(toThemeRecord);
}

export function buildThemeRecordDetail(sessions: StudySession[], theme: string): ThemeRecordDetail | undefined {
  const acc = buildAccumulators(sessions)[theme];
  if (!acc) return undefined;

  const history = sessions
    .filter((s) => s.theme === theme && s.score !== null)
    .map((s) => ({
      date: s.createdAt,
      score: s.score,
      durationMinutes: s.durationMinutes,
      efficiency: calculateEfficiencyIndex(s.score ?? 0, s.durationMinutes),
    }));

  return { ...toThemeRecord(acc), history };
}

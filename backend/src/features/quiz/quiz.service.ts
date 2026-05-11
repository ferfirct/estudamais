import type { IAiService } from './quiz.ai.js';
import type { QuizQuestion, QuizResult } from './quiz.types.js';
import type { ISessionRepository } from '../session/session.repository.js';
import { calculateEfficiencyIndex } from '../session/session.domain.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

export class GenerateQuizUseCase {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly ai: IAiService,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    theme: string,
    durationMinutes: number,
    previousScores?: number[],
  ): Promise<{ sessionId: string; questions: QuizQuestion[] }> {
    if (!this.sessions.findById(sessionId, userId)) {
      throw new HttpError(404, 'Sessão não encontrada');
    }

    const scores = previousScores?.length
      ? previousScores
      : this.sessions
          .list(userId)
          .filter((s) => s.theme === theme && s.score !== null)
          .map((s) => s.score as number);

    const questions = await this.ai.generateQuiz(
      theme,
      durationMinutes,
      scores.length > 0 ? scores : undefined,
    );
    return { sessionId, questions };
  }
}

export class EvaluateQuizUseCase {
  constructor(
    private readonly sessions: ISessionRepository,
    private readonly ai: IAiService,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    questions: QuizQuestion[],
    userAnswers: Record<string, string>,
  ): Promise<QuizResult> {
    const session = this.sessions.findById(sessionId, userId);
    if (!session) throw new HttpError(404, 'Sessão não encontrada');

    const { score, gapAnalysis } = await this.ai.evaluateAnswers(
      session.theme,
      questions,
      userAnswers,
    );

    const efficiencyIndex =
      session.durationMinutes > 0
        ? calculateEfficiencyIndex(score, session.durationMinutes)
        : null;

    this.sessions.update(sessionId, userId, { score, efficiencyIndex, quizCompleted: true });

    return { sessionId, questions, userAnswers, score, gapAnalysis, evaluatedAt: new Date().toISOString() };
  }
}

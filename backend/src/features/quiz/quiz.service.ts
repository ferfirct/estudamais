import type { IAiService, GenerateOptions } from './quiz.ai.js';
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
    options?: GenerateOptions,
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
      options,
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

export class ExplainQuestionUseCase {
  constructor(private readonly ai: IAiService) {}

  async execute(
    theme: string,
    question: QuizQuestion,
    userAnswer: string,
    quizType: string,
  ): Promise<{ explanation: string }> {
    return this.ai.explainQuestion(theme, question, userAnswer, quizType);
  }
}

export class AnswerDoubtUseCase {
  constructor(private readonly ai: IAiService) {}

  async execute(params: {
    theme: string;
    question: QuizQuestion;
    correctAnswer?: string;
    userAnswer: string;
    explanation: string;
    doubt: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ answer: string }> {
    return this.ai.answerDoubt(params);
  }
}

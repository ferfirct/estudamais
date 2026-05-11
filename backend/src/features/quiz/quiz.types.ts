export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'open_ended';
  question: string;
  options?: string[];
  correctAnswer?: string;
}

export interface QuizResult {
  sessionId: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  score: number;
  gapAnalysis: string;
  evaluatedAt: string;
}

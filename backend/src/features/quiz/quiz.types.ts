export interface SummationItem {
  value: number;
  statement: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'summation' | 'open_ended';
  question: string;
  options?: string[];
  summationItems?: SummationItem[];
  correctAnswer?: string;
  hint?: string;
  learningHint?: string;
  explanation?: string;
}

export interface QuizResult {
  sessionId: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
  score: number;
  gapAnalysis: string;
  evaluatedAt: string;
}

export interface WrongQuestion {
  id: string;
  sessionId: string;
  theme: string;
  question: QuizQuestion;
  userAnswer: string;
  quizType: 'free' | 'civil_service' | 'vestibular';
  difficulty: 'easy' | 'medium' | 'hard';
  savedAt: string;
  retried: boolean;
  retriedAt?: string;
}

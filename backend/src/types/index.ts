export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'dark' | 'light' | 'system';
  dailyGoal: number;
  language: string;
  notifications: boolean;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  theme: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  score: number | null;
  efficiencyIndex: number | null;
  quizCompleted: boolean;
  createdAt: string;
}

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

export interface DashboardStats {
  totalSessions: number;
  averageScore: number;
  averageEfficiency: number;
  sessionsByTheme: Array<{ theme: string; count: number; avgScore: number }>;
  criticalThemes: StudySession[];
}

export interface ApiError {
  error: string;
  details?: unknown;
}

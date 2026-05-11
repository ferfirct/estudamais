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

export interface CreateSessionInput {
  theme: string;
  startTime: string;
}

export interface UpdateSessionPatch {
  endTime?: string;
  durationMinutes?: number;
  score?: number | null;
  efficiencyIndex?: number | null;
  quizCompleted?: boolean;
}

export type UpdateSessionInput = Omit<UpdateSessionPatch, 'efficiencyIndex'>;

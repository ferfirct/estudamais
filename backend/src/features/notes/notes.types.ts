export interface Note {
  id: string;
  userId: string;
  sessionId?: string;
  questionId?: string;
  theme?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

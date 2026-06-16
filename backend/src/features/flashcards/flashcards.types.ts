export interface Flashcard {
  id: string;
  userId: string;
  theme: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReview: string;
  reviewCount: number;
  createdAt: string;
}

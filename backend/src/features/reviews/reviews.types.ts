export type ReviewUrgency = 'high' | 'medium' | 'low';

export interface DueReview {
  theme: string;
  lastScore: number;
  lastDate: string;
  dueDate: string;
  daysOverdue: number;
  urgency: ReviewUrgency;
}

export interface ScheduledReview {
  theme: string;
  lastScore: number;
  lastDate: string;
  nextReview: string;
  urgency: ReviewUrgency;
}

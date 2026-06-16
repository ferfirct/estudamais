import type { IGoalRepository } from './goals.repository.js';
import type { ThemeGoal } from './goals.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

export class UpsertGoalUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  execute(userId: string, theme: string, targetScore: number): ThemeGoal {
    if (targetScore < 0 || targetScore > 10) {
      throw new HttpError(400, 'targetScore deve ser entre 0 e 10.');
    }
    return this.goals.upsert(userId, theme, targetScore);
  }
}

export class ListGoalsUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  execute(userId: string): ThemeGoal[] {
    return this.goals.findByUser(userId);
  }
}

export class DeleteGoalUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  execute(userId: string, theme: string): void {
    this.goals.deleteByTheme(userId, theme);
  }
}

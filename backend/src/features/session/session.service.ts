import type { ISessionRepository } from './session.repository.js';
import type { StudySession, UpdateSessionInput } from './session.types.js';
import { calculateEfficiencyIndex } from './session.domain.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

export class CreateSessionUseCase {
  constructor(private readonly sessions: ISessionRepository) {}

  execute(userId: string, theme: string, startTime?: string): StudySession {
    return this.sessions.create(userId, {
      theme,
      startTime: startTime ?? new Date().toISOString(),
    });
  }
}

export class UpdateSessionUseCase {
  constructor(private readonly sessions: ISessionRepository) {}

  execute(id: string, userId: string, patch: UpdateSessionInput): StudySession {
    const current = this.sessions.findById(id, userId);
    if (!current) throw new HttpError(404, 'Sessão não encontrada');

    const nextScore = patch.score ?? current.score;
    const nextDuration = patch.durationMinutes ?? current.durationMinutes;
    const efficiencyIndex =
      nextScore !== null && nextDuration > 0
        ? calculateEfficiencyIndex(nextScore, nextDuration)
        : undefined;

    const updated = this.sessions.update(id, userId, {
      ...patch,
      ...(efficiencyIndex !== undefined ? { efficiencyIndex } : {}),
    });

    if (!updated) throw new HttpError(404, 'Sessão não encontrada');
    return updated;
  }
}

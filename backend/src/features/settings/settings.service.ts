import type { ISettingsRepository } from './settings.repository.js';
import type { UserSettings, UpdateSettingsPatch } from './settings.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

export class GetSettingsUseCase {
  constructor(private readonly settings: ISettingsRepository) {}

  execute(userId: string): UserSettings {
    const found = this.settings.findByUserId(userId);
    if (!found) throw new HttpError(404, 'Configurações não encontradas.');
    return found;
  }
}

export class UpdateSettingsUseCase {
  constructor(private readonly settings: ISettingsRepository) {}

  execute(userId: string, patch: UpdateSettingsPatch): UserSettings | undefined {
    return this.settings.update(userId, patch);
  }
}

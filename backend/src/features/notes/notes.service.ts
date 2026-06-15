import type { INoteRepository } from './notes.repository.js';
import type { Note } from './notes.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

export class CreateNoteUseCase {
  constructor(private readonly notes: INoteRepository) {}

  execute(userId: string, data: { content: string; sessionId?: string; questionId?: string; theme?: string }): Note {
    if (!data.content.trim()) throw new HttpError(400, 'Conteúdo não pode estar vazio.');
    return this.notes.create(userId, data);
  }
}

export class ListNotesUseCase {
  constructor(private readonly notes: INoteRepository) {}

  execute(userId: string, filters: { theme?: string; sessionId?: string }): Note[] {
    if (filters.theme) return this.notes.findByTheme(userId, filters.theme);
    if (filters.sessionId) return this.notes.findBySession(userId, filters.sessionId);
    return this.notes.findByUser(userId);
  }
}

export class UpdateNoteUseCase {
  constructor(private readonly notes: INoteRepository) {}

  execute(id: string, userId: string, content: string): Note {
    if (!content.trim()) throw new HttpError(400, 'Conteúdo não pode estar vazio.');
    const updated = this.notes.update(id, userId, content);
    if (!updated) throw new HttpError(404, 'Anotação não encontrada.');
    return updated;
  }
}

export class DeleteNoteUseCase {
  constructor(private readonly notes: INoteRepository) {}

  execute(id: string, userId: string): void {
    this.notes.deleteById(id, userId);
  }
}

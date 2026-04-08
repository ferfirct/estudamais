import fs from 'node:fs';
import path from 'node:path';
import type { StudySession } from '../types/index.js';

// Persistência simples em JSON — adequada ao contexto acadêmico do projeto.
const DB_PATH = path.resolve(process.cwd(), 'db.json');

interface DbShape {
  sessions: StudySession[];
}

function read(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ sessions: [] }, null, 2));
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw) as DbShape;
  } catch {
    return { sessions: [] };
  }
}

function write(db: DbShape): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const db = {
  listSessions(): StudySession[] {
    return read().sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getSession(id: string): StudySession | undefined {
    return read().sessions.find((s) => s.id === id);
  },
  createSession(session: StudySession): StudySession {
    const data = read();
    data.sessions.push(session);
    write(data);
    return session;
  },
  updateSession(id: string, patch: Partial<StudySession>): StudySession | undefined {
    const data = read();
    const idx = data.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    data.sessions[idx] = { ...data.sessions[idx], ...patch };
    write(data);
    return data.sessions[idx];
  },
};

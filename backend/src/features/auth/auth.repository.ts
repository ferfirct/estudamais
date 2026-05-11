import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { User, UserWithPassword } from './auth.types.js';

export interface IUserRepository {
  create(name: string, email: string, hashedPassword: string): User;
  findById(id: string): UserWithPassword | undefined;
  findByEmail(email: string): UserWithPassword | undefined;
}

const stmtCreate = db.prepare(
  'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)'
);
const stmtCreateSettings = db.prepare('INSERT INTO user_settings (user_id) VALUES (?)');
const stmtFindById = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtFindByEmail = db.prepare('SELECT * FROM users WHERE email = ?');

function mapRow(row: Record<string, unknown>): UserWithPassword {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    createdAt: row.created_at as string,
  };
}

class SqliteUserRepository implements IUserRepository {
  create(name: string, email: string, hashedPassword: string): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    stmtCreate.run(id, name, email, hashedPassword, now);
    stmtCreateSettings.run(id);
    return { id, name, email, createdAt: now };
  }

  findById(id: string): UserWithPassword | undefined {
    const row = stmtFindById.get(id) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  findByEmail(email: string): UserWithPassword | undefined {
    const row = stmtFindByEmail.get(email) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }
}

export const userRepository: IUserRepository = new SqliteUserRepository();

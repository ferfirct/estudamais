import { randomUUID } from 'node:crypto';
import db from '../../shared/infra/database.js';
import type { User, UserWithPassword } from './auth.types.js';

export interface IUserRepository {
  create(name: string, email: string, hashedPassword: string, role?: 'user' | 'admin'): User;
  findById(id: string): UserWithPassword | undefined;
  findByEmail(email: string): UserWithPassword | undefined;
  findAll(): User[];
  deleteById(id: string): void;
  updateProfile(id: string, data: { name?: string; email?: string }): User;
  updatePassword(id: string, hashedPassword: string): void;
}

const stmtCreate = db.prepare(
  'INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
);
const stmtCreateSettings = db.prepare('INSERT INTO user_settings (user_id) VALUES (?)');
const stmtFindById = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtFindByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const stmtFindAll = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
const stmtDeleteById = db.prepare('DELETE FROM users WHERE id = ?');
const stmtUpdateName = db.prepare('UPDATE users SET name = ? WHERE id = ?');
const stmtUpdateEmail = db.prepare('UPDATE users SET email = ? WHERE id = ?');
const stmtUpdateNameEmail = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
const stmtUpdatePassword = db.prepare('UPDATE users SET password = ? WHERE id = ?');

function mapRow(row: Record<string, unknown>): UserWithPassword {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    role: (row.role as 'user' | 'admin') ?? 'user',
    createdAt: row.created_at as string,
  };
}

class SqliteUserRepository implements IUserRepository {
  create(name: string, email: string, hashedPassword: string, role: 'user' | 'admin' = 'user'): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    stmtCreate.run(id, name, email, hashedPassword, role, now);
    stmtCreateSettings.run(id);
    return { id, name, email, role, createdAt: now };
  }

  findById(id: string): UserWithPassword | undefined {
    const row = stmtFindById.get(id) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  findByEmail(email: string): UserWithPassword | undefined {
    const row = stmtFindByEmail.get(email) as Record<string, unknown> | undefined;
    return row ? mapRow(row) : undefined;
  }

  findAll(): User[] {
    const rows = stmtFindAll.all() as Array<Record<string, unknown>>;
    return rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      role: (row.role as 'user' | 'admin') ?? 'user',
      createdAt: row.created_at as string,
    }));
  }

  deleteById(id: string): void {
    stmtDeleteById.run(id);
  }

  updateProfile(id: string, data: { name?: string; email?: string }): User {
    if (data.name && data.email) {
      stmtUpdateNameEmail.run(data.name, data.email, id);
    } else if (data.name) {
      stmtUpdateName.run(data.name, id);
    } else if (data.email) {
      stmtUpdateEmail.run(data.email, id);
    }
    const row = stmtFindById.get(id) as Record<string, unknown>;
    const { password: _, ...user } = mapRow(row);
    return user;
  }

  updatePassword(id: string, hashedPassword: string): void {
    stmtUpdatePassword.run(hashedPassword, id);
  }
}

export const userRepository: IUserRepository = new SqliteUserRepository();

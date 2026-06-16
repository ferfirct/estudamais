import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(process.cwd(), 'estuda.db');

const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

// Migration: add role column to existing databases
const cols = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
if (!cols.some(c => c.name === 'role')) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin'))");
}

export default db;

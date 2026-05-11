import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(process.cwd(), 'estuda.db');

const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

export default db;

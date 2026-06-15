import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import db from './database.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    console.error('[seed-admin] ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios no .env');
    process.exit(1);
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log(`[seed-admin] Admin já existe: ${email}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, hashed, 'admin', now);

  db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(id);

  console.log(`[seed-admin] Admin criado: ${email} (id: ${id})`);
}

main().catch(err => {
  console.error('[seed-admin] Erro:', err);
  process.exit(1);
});

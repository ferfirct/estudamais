import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { IUserRepository } from './auth.repository.js';
import type { User } from './auth.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

const BCRYPT_ROUNDS = 10;

function signToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
  );
}

export class RegisterUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    if (this.users.findByEmail(email)) throw new HttpError(409, 'Este email já está cadastrado.');
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.users.create(name, email, hashed);
    return { user, token: signToken(user.id) };
  }
}

export class LoginUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(email: string, password: string): Promise<{ user: User; token: string }> {
    const found = this.users.findByEmail(email);
    if (!found) throw new HttpError(401, 'Email ou senha incorretos.');
    if (!await bcrypt.compare(password, found.password)) throw new HttpError(401, 'Email ou senha incorretos.');
    const { password: _, ...safeUser } = found;
    return { user: safeUser, token: signToken(found.id) };
  }
}

export class GetMeUseCase {
  constructor(private readonly users: IUserRepository) {}

  execute(userId: string): User {
    const found = this.users.findById(userId);
    if (!found) throw new HttpError(404, 'Usuário não encontrado.');
    const { password: _, ...safeUser } = found;
    return safeUser;
  }
}

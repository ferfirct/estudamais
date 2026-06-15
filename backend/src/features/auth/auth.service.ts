import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { IUserRepository } from './auth.repository.js';
import type { User } from './auth.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

const BCRYPT_ROUNDS = 10;

function signToken(userId: string, role: 'user' | 'admin'): string {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] }
  );
}

export class RegisterUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    if (this.users.findByEmail(email)) throw new HttpError(409, 'Este email já está cadastrado.');
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.users.create(name, email, hashed, 'user');
    return { user, token: signToken(user.id, user.role) };
  }
}

export class CreateUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(name: string, email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<{ user: User }> {
    if (this.users.findByEmail(email)) throw new HttpError(409, 'Este email já está cadastrado.');
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = this.users.create(name, email, hashed, role);
    return { user };
  }
}

export class LoginUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(email: string, password: string): Promise<{ user: User; token: string }> {
    const found = this.users.findByEmail(email);
    if (!found) throw new HttpError(401, 'Email ou senha incorretos.');
    if (!await bcrypt.compare(password, found.password)) throw new HttpError(401, 'Email ou senha incorretos.');
    const { password: _, ...safeUser } = found;
    return { user: safeUser, token: signToken(found.id, found.role) };
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

export class ListUsersUseCase {
  constructor(private readonly users: IUserRepository) {}

  execute(): User[] {
    return this.users.findAll();
  }
}

export class DeleteUserUseCase {
  constructor(private readonly users: IUserRepository) {}

  execute(id: string): void {
    const found = this.users.findById(id);
    if (!found) throw new HttpError(404, 'Usuário não encontrado.');
    this.users.deleteById(id);
  }
}

export class UpdateProfileUseCase {
  constructor(private readonly users: IUserRepository) {}

  execute(userId: string, data: { name?: string; email?: string }): User {
    if (data.email) {
      const existing = this.users.findByEmail(data.email);
      if (existing && existing.id !== userId) {
        throw new HttpError(409, 'Este email já está em uso.');
      }
    }
    return this.users.updateProfile(userId, data);
  }
}

export class ChangePasswordUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const found = this.users.findById(userId);
    if (!found) throw new HttpError(404, 'Usuário não encontrado.');
    if (!await bcrypt.compare(currentPassword, found.password)) {
      throw new HttpError(401, 'Senha atual incorreta.');
    }
    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    this.users.updatePassword(userId, hashed);
  }
}

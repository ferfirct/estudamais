import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from './auth.repository.js';
import {
  RegisterUseCase,
  CreateUserUseCase,
  LoginUseCase,
  GetMeUseCase,
  ListUsersUseCase,
  DeleteUserUseCase,
  UpdateProfileUseCase,
  ChangePasswordUseCase,
} from './auth.service.js';
import { registerSchema, loginSchema, createUserSchema, updateProfileSchema, changePasswordSchema } from './auth.schema.js';
import { requireAuth } from '../../shared/middleware/auth.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';
import { requireAdmin } from '../../shared/middleware/requireAdmin.js';
import type { AuthRequest } from '../../shared/middleware/auth.js';

const router = Router();

const register = new RegisterUseCase(userRepository);
const createUser = new CreateUserUseCase(userRepository);
const login = new LoginUseCase(userRepository);
const getMe = new GetMeUseCase(userRepository);
const listUsers = new ListUsersUseCase(userRepository);
const deleteUser = new DeleteUserUseCase(userRepository);
const updateProfile = new UpdateProfileUseCase(userRepository);
const changePassword = new ChangePasswordUseCase(userRepository);

router.post('/register', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    res.status(201).json(await register.execute(name, email, password));
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    res.json(await login.execute(email, password));
  } catch (err) {
    next(err);
  }
});

router.get('/me', (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Sem token.');
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string };
    res.json(getMe.execute(payload.sub));
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    res.json(updateProfile.execute(req.userId!, data));
  } catch (err) {
    next(err);
  }
});

router.patch('/password', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword.execute(req.userId!, currentPassword, newPassword);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/admin/create-user', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = createUserSchema.parse(req.body);
    res.status(201).json(await createUser.execute(name, email, password, role));
  } catch (err) {
    next(err);
  }
});

router.get('/admin/users', requireAdmin, (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(listUsers.execute());
  } catch (err) {
    next(err);
  }
});

router.delete('/admin/users/:id', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    deleteUser.execute(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;

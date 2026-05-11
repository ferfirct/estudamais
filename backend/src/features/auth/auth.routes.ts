import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from './auth.repository.js';
import { RegisterUseCase, LoginUseCase, GetMeUseCase } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

const router = Router();

const register = new RegisterUseCase(userRepository);
const login = new LoginUseCase(userRepository);
const getMe = new GetMeUseCase(userRepository);

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
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

export default router;

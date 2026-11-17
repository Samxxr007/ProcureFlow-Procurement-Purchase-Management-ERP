import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }
      const result = await AuthService.login(email, password, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.logout(req.user?.sessionId, req.user?.id, req.ip);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshTokens(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }
      const user = await AuthService.getMe(req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

export class UserController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.list();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(req.params.id as string);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.create(req.body, req.user!);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.update(req.params.id as string, req.body, req.user!);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

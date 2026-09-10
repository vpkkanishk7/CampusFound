import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'campus_find_dsa_secret_key_2026';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For dev ease, fallback to mock user if token not present
    req.user = { id: 'u-1', email: 'alex.j@campus.edu' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { id: 'u-1', email: 'alex.j@campus.edu' };
      return next();
    }
    req.user = user as any;
    next();
  });
}

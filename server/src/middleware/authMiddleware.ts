import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AuthenticatedUserPayload } from '../types/index.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.pollhub_access_token) {
      token = req.cookies.pollhub_access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    let payload: AuthenticatedUserPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUserPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh your session.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Verify user in database
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // Check if session is still active
    const sessionActive = user.activeSessions.some((s) => s.sessionId === payload.sessionId);
    if (!sessionActive && payload.role !== 'ADMIN') {
      res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired. Please sign in again.',
        code: 'SESSION_REVOKED'
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      employeeId: user.employeeId,
      role: user.role,
      sessionId: payload.sessionId
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
      code: 'FORBIDDEN'
    });
    return;
  }
  next();
}

export function requireEmployee(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'EMPLOYEE') {
    res.status(403).json({
      success: false,
      message: 'Access restricted to employee accounts.',
      code: 'EMPLOYEE_ONLY'
    });
    return;
  }
  next();
}

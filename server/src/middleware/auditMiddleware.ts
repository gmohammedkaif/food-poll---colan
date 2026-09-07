import { Request, Response, NextFunction } from 'express';
import { ClientContext } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      clientContext?: ClientContext;
      user?: {
        userId: string;
        employeeId: string;
        role: 'ADMIN' | 'EMPLOYEE';
        sessionId: string;
      };
    }
  }
}

export function auditMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  const sessionId = (req.headers['x-session-id'] as string) || req.cookies?.pollhub_session || 'sess_' + Math.random().toString(36).substring(2, 12);
  const deviceIdentifier = (req.headers['x-device-id'] as string) || 'dev_' + Buffer.from(userAgent.substring(0, 32)).toString('hex').substring(0, 12);

  req.clientContext = {
    ipAddress,
    userAgent,
    sessionId,
    deviceIdentifier
  };

  next();
}

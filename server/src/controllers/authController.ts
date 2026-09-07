import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import * as authService from '../services/authService.js';
import { env } from '../config/env.js';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId, password } = req.body;
    const clientContext = req.clientContext!;

    const result = await authService.login(employeeId, password, clientContext);

    // Set secure HTTP-only refresh token cookie with 30-minute sliding window
    res.cookie('pollhub_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.cookie('pollhub_session', result.sessionId, {
      httpOnly: false,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${result.user.name}`,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        sessionId: result.sessionId
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.pollhub_refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'No refresh token provided.',
        code: 'NO_REFRESH_TOKEN'
      });
      return;
    }

    const clientContext = req.clientContext!;
    const result = await authService.refreshAccessToken(refreshToken, clientContext);

    res.cookie('pollhub_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000 // 30 minutes
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        sessionId: result.sessionId
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await authService.logout(req.user.userId, req.user.sessionId, req.clientContext!);
    }

    res.clearCookie('pollhub_refresh_token');
    res.clearCookie('pollhub_access_token');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        status: user.status,
        department: user.department,
        activeSessionsCount: user.activeSessions.length,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

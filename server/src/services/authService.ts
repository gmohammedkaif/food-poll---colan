import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { SecurityAlert } from '../models/SecurityAlert.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { env } from '../config/env.js';
import { ClientContext, AuthenticatedUserPayload } from '../types/index.js';
import { broadcastSecurityAlert } from './socketService.js';

export interface LoginResult {
  user: {
    id: string;
    employeeId: string;
    name: string;
    role: string;
    department?: string;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export async function login(
  employeeId: string,
  plainTextPassword: string,
  clientContext: ClientContext
): Promise<LoginResult> {
  const normalizedId = employeeId.trim().toUpperCase();
  const user = await User.findOne({ employeeId: normalizedId });

  if (!user) {
    // Record login failure audit
    await AuditLog.create({
      actorEmployeeId: normalizedId,
      actorRole: 'EMPLOYEE',
      action: 'LOGIN_FAILURE',
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      sessionId: clientContext.sessionId,
      deviceIdentifier: clientContext.deviceIdentifier,
      timestamp: new Date(),
      reason: 'Invalid credentials: User ID not found'
    });

    throw { status: 401, message: 'Invalid Employee ID or password.', code: 'INVALID_CREDENTIALS' };
  }

  if (user.status !== 'ACTIVE') {
    await AuditLog.create({
      actorUserId: user._id,
      actorEmployeeId: user.employeeId,
      actorRole: user.role,
      action: 'LOGIN_FAILURE',
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      sessionId: clientContext.sessionId,
      deviceIdentifier: clientContext.deviceIdentifier,
      timestamp: new Date(),
      reason: 'Login rejected: Account is deactivated'
    });

    throw {
      status: 403,
      message: 'This account has been deactivated. Please contact your company administrator.',
      code: 'ACCOUNT_DEACTIVATED'
    };
  }

  const isPasswordValid = await bcrypt.compare(plainTextPassword, user.passwordHash);

  if (!isPasswordValid) {
    await AuditLog.create({
      actorUserId: user._id,
      actorEmployeeId: user.employeeId,
      actorRole: user.role,
      action: 'LOGIN_FAILURE',
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      sessionId: clientContext.sessionId,
      deviceIdentifier: clientContext.deviceIdentifier,
      timestamp: new Date(),
      reason: 'Invalid credentials: Password mismatch'
    });

    // Check recent failed logins in past 10 minutes to trigger alert if >= 4
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failedCount = await AuditLog.countDocuments({
      actorEmployeeId: user.employeeId,
      action: 'LOGIN_FAILURE',
      timestamp: { $gte: tenMinsAgo }
    });

    if (failedCount >= 3) {
      const alert = await SecurityAlert.create({
        severity: 'MEDIUM',
        type: 'REPEATED_FAILED_LOGINS',
        employeeId: user._id,
        employeeIdString: user.employeeId,
        description: `Multiple failed login attempts detected for ${user.employeeId} from IP ${clientContext.ipAddress}.`,
        details: { attempts: failedCount, ipAddress: clientContext.ipAddress, userAgent: clientContext.userAgent }
      });
      broadcastSecurityAlert(alert);
    }

    throw { status: 401, message: 'Invalid Employee ID or password.', code: 'INVALID_CREDENTIALS' };
  }

  // Get system settings for session limits
  const settings = await SystemSetting.findOne({ key: 'GLOBAL_SETTINGS' });
  const maxSessions = settings?.maxActiveSessionsPerEmployee || 3;

  const now = new Date();
  const sessionId = clientContext.sessionId || 'sess_' + Math.random().toString(36).substring(2, 12);

  // Manage user active sessions
  const updatedSessions = user.activeSessions.filter((s) => s.sessionId !== sessionId);
  updatedSessions.push({
    sessionId,
    deviceIdentifier: clientContext.deviceIdentifier,
    userAgent: clientContext.userAgent,
    ipAddress: clientContext.ipAddress,
    lastActiveAt: now,
    createdAt: now
  });

  // Limit to max sessions (FIFO)
  if (updatedSessions.length > maxSessions) {
    updatedSessions.splice(0, updatedSessions.length - maxSessions);
  }

  user.activeSessions = updatedSessions;
  user.lastLoginAt = now;
  await user.save();

  // Generate Tokens
  const payload: AuthenticatedUserPayload = {
    userId: user._id.toString(),
    employeeId: user.employeeId,
    role: user.role,
    sessionId
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '30m'
  });

  const refreshToken = jwt.sign({ userId: user._id.toString(), sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: '30m'
  });

  // Record login success audit
  await AuditLog.create({
    actorUserId: user._id,
    actorEmployeeId: user.employeeId,
    actorRole: user.role,
    action: 'LOGIN_SUCCESS',
    ipAddress: clientContext.ipAddress,
    userAgent: clientContext.userAgent,
    sessionId,
    deviceIdentifier: clientContext.deviceIdentifier,
    timestamp: now,
    reason: `Successful authentication for ${user.name} (${user.role})`
  });

  return {
    user: {
      id: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      department: user.department
    },
    accessToken,
    refreshToken,
    sessionId
  };
}

export async function refreshAccessToken(refreshTokenStr: string, clientContext: ClientContext) {
  let decoded: { userId: string; sessionId: string };
  try {
    decoded = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as { userId: string; sessionId: string };
  } catch (err) {
    throw { status: 401, message: 'Session expired due to inactivity. Please log in again.', code: 'INVALID_REFRESH_TOKEN' };
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.status !== 'ACTIVE') {
    throw { status: 401, message: 'User not active or not found.', code: 'USER_INACTIVE' };
  }

  const session = user.activeSessions.find((s) => s.sessionId === decoded.sessionId);
  if (!session) {
    throw { status: 401, message: 'Session revoked.', code: 'SESSION_REVOKED' };
  }

  // Enforce 30-minute inactivity timeout policy
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (session.lastActiveAt && new Date(session.lastActiveAt).getTime() < thirtyMinsAgo.getTime()) {
    user.activeSessions = user.activeSessions.filter((s) => s.sessionId !== decoded.sessionId);
    await user.save();
    throw { status: 401, message: 'Session expired due to 30 minutes of inactivity. Please log in again.', code: 'SESSION_INACTIVITY_TIMEOUT' };
  }

  session.lastActiveAt = new Date();
  await user.save();

  const payload: AuthenticatedUserPayload = {
    userId: user._id.toString(),
    employeeId: user.employeeId,
    role: user.role,
    sessionId: decoded.sessionId
  };

  const newAccessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
  const newRefreshToken = jwt.sign({ userId: user._id.toString(), sessionId: decoded.sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: '30m'
  });

  return {
    user: {
      id: user._id.toString(),
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      department: user.department
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId: decoded.sessionId
  };
}

export async function logout(userId: string, sessionId: string, clientContext: ClientContext): Promise<void> {
  const user = await User.findById(userId);
  if (user) {
    user.activeSessions = user.activeSessions.filter((s) => s.sessionId !== sessionId);
    await user.save();

    await AuditLog.create({
      actorUserId: user._id,
      actorEmployeeId: user.employeeId,
      actorRole: user.role,
      action: 'LOGOUT',
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      sessionId,
      deviceIdentifier: clientContext.deviceIdentifier,
      timestamp: new Date(),
      reason: 'User logged out voluntarily'
    });
  }
}

export async function revokeAllSessions(
  targetUserId: string,
  adminUserId: string,
  clientContext: ClientContext
): Promise<void> {
  const user = await User.findById(targetUserId);
  if (!user) throw { status: 404, message: 'Employee not found', code: 'USER_NOT_FOUND' };

  user.activeSessions = [];
  await user.save();

  await AuditLog.create({
    actorUserId: new Types.ObjectId(adminUserId),
    actorRole: 'ADMIN',
    action: 'SESSIONS_REVOKED',
    ipAddress: clientContext.ipAddress,
    userAgent: clientContext.userAgent,
    sessionId: clientContext.sessionId,
    deviceIdentifier: clientContext.deviceIdentifier,
    timestamp: new Date(),
    reason: `All active sessions revoked for employee ${user.employeeId} by administrator.`
  });
}

export async function resetEmployeePassword(
  targetUserId: string,
  newPlainTextPassword: string,
  adminUserId: string,
  clientContext: ClientContext
): Promise<void> {
  const user = await User.findById(targetUserId);
  if (!user) throw { status: 404, message: 'Employee not found', code: 'USER_NOT_FOUND' };

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPlainTextPassword, salt);
  user.activeSessions = []; // Revoke sessions to force fresh login
  await user.save();

  await AuditLog.create({
    actorUserId: new Types.ObjectId(adminUserId),
    actorRole: 'ADMIN',
    action: 'PASSWORD_RESET',
    ipAddress: clientContext.ipAddress,
    userAgent: clientContext.userAgent,
    sessionId: clientContext.sessionId,
    deviceIdentifier: clientContext.deviceIdentifier,
    timestamp: new Date(),
    reason: `Password reset for employee ${user.employeeId} by administrator.`
  });
}

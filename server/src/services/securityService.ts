import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { SecurityAlert } from '../models/SecurityAlert.js';
import { User } from '../models/User.js';

export async function getAuditLogs(options: {
  pollId?: string;
  actorUserId?: string;
  actorEmployeeId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const query: any = {};

  if (options.pollId && Types.ObjectId.isValid(options.pollId)) {
    query.pollId = new Types.ObjectId(options.pollId);
  }
  if (options.actorUserId && Types.ObjectId.isValid(options.actorUserId)) {
    query.actorUserId = new Types.ObjectId(options.actorUserId);
  }
  if (options.actorEmployeeId) {
    query.actorEmployeeId = new RegExp(options.actorEmployeeId, 'i');
  }
  if (options.action) {
    query.action = options.action;
  }
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('actorUserId', 'employeeId name role')
      .populate('pollId', 'title pollDate')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getSecurityAlerts(options: {
  resolved?: boolean;
  severity?: string;
  page?: number;
  limit?: number;
}) {
  const query: any = {};
  if (options.resolved !== undefined) {
    query.resolved = options.resolved;
  }
  if (options.severity) {
    query.severity = options.severity;
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const [alerts, total, unresolvedCount] = await Promise.all([
    SecurityAlert.find(query)
      .populate('employeeId', 'employeeId name department')
      .populate('pollId', 'title')
      .populate('resolvedBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SecurityAlert.countDocuments(query),
    SecurityAlert.countDocuments({ resolved: false })
  ]);

  return {
    alerts,
    unresolvedCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function resolveSecurityAlert(alertId: string, adminUserId: string) {
  const alert = await SecurityAlert.findById(alertId);
  if (!alert) throw { status: 404, message: 'Alert not found', code: 'ALERT_NOT_FOUND' };

  alert.resolved = true;
  alert.resolvedAt = new Date();
  alert.resolvedBy = new Types.ObjectId(adminUserId);
  await alert.save();

  return alert;
}

export async function getSecurityOverview() {
  const [
    unresolvedAlertsCount,
    criticalCount,
    highCount,
    recentVoteModifications,
    totalEmployeesWithMultipleSessions
  ] = await Promise.all([
    SecurityAlert.countDocuments({ resolved: false }),
    SecurityAlert.countDocuments({ resolved: false, severity: 'CRITICAL' }),
    SecurityAlert.countDocuments({ resolved: false, severity: 'HIGH' }),
    AuditLog.countDocuments({
      action: 'VOTE_UPDATED',
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    User.countDocuments({
      role: 'EMPLOYEE',
      'activeSessions.1': { $exists: true } // has 2 or more sessions
    })
  ]);

  return {
    unresolvedAlertsCount,
    criticalCount,
    highCount,
    recentVoteModifications,
    totalEmployeesWithMultipleSessions
  };
}

export async function deleteSecurityAlert(alertId: string) {
  const alert = await SecurityAlert.findByIdAndDelete(alertId);
  if (!alert) {
    throw { status: 404, message: 'Security alert not found.', code: 'ALERT_NOT_FOUND' };
  }
  return alert;
}

export async function clearSecurityAlerts(resolvedOnly?: boolean) {
  const query = resolvedOnly ? { resolved: true } : {};
  const result = await SecurityAlert.deleteMany(query);
  return result.deletedCount;
}

export async function deleteAuditLog(logId: string) {
  const log = await AuditLog.findByIdAndDelete(logId);
  if (!log) {
    throw { status: 404, message: 'Audit log not found.', code: 'LOG_NOT_FOUND' };
  }
  return log;
}

export async function clearAuditLogs() {
  const result = await AuditLog.deleteMany({});
  return result.deletedCount;
}


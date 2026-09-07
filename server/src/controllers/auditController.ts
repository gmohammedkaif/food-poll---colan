import { Request, Response, NextFunction } from 'express';
import * as securityService from '../services/securityService.js';

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pollId, actorUserId, actorEmployeeId, action, startDate, endDate, page, limit } = req.query;

    const result = await securityService.getAuditLogs({
      pollId: pollId ? String(pollId) : undefined,
      actorUserId: actorUserId ? String(actorUserId) : undefined,
      actorEmployeeId: actorEmployeeId ? String(actorEmployeeId) : undefined,
      action: action ? String(action) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getSecurityAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resolved, severity, page, limit } = req.query;

    const result = await securityService.getSecurityAlerts({
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      severity: severity ? String(severity) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function resolveSecurityAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const alert = await securityService.resolveSecurityAlert(id, req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Security alert marked as reviewed and resolved.',
      data: alert
    });
  } catch (error) {
    next(error);
  }
}

export async function getSecurityOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const overview = await securityService.getSecurityOverview();
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSecurityAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await securityService.deleteSecurityAlert(id);
    res.status(200).json({
      success: true,
      message: 'Security alert permanently removed from database.'
    });
  } catch (error) {
    next(error);
  }
}

export async function clearSecurityAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resolvedOnly } = req.query;
    const count = await securityService.clearSecurityAlerts(resolvedOnly === 'true');
    res.status(200).json({
      success: true,
      message: `${count} security alert(s) removed from database.`,
      data: { deletedCount: count }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAuditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await securityService.deleteAuditLog(id);
    res.status(200).json({
      success: true,
      message: 'Audit log record permanently removed from database.'
    });
  } catch (error) {
    next(error);
  }
}

export async function clearAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await securityService.clearAuditLogs();
    res.status(200).json({
      success: true,
      message: `${count} audit log record(s) removed from database.`,
      data: { deletedCount: count }
    });
  } catch (error) {
    next(error);
  }
}


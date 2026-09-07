import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import * as authService from '../services/authService.js';

export async function getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, status, role, page = '1', limit = '20' } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { employeeId: new RegExp(String(search), 'i') },
        { name: new RegExp(String(search), 'i') },
        { department: new RegExp(String(search), 'i') }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [employees, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ employeeId: 1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { employeeId, name, password, department, status, role } = req.body;
    const normalizedId = employeeId.trim().toUpperCase();

    const existing = await User.findOne({ employeeId: normalizedId });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `Employee ID "${normalizedId}" is already assigned.`,
        code: 'EMPLOYEE_EXISTS'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const employee = new User({
      employeeId: normalizedId,
      name: name.trim(),
      passwordHash,
      department: department?.trim(),
      status: status || 'ACTIVE',
      role: role || 'EMPLOYEE'
    });

    await employee.save();

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'ACCOUNT_ACTIVATED',
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: `Admin created employee account "${employee.name}" (${employee.employeeId}).`
    });

    const userObj = employee.toObject();
    delete (userObj as any).passwordHash;

    res.status(201).json({
      success: true,
      message: `Employee "${employee.name}" created successfully.`,
      data: userObj
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid employee ID', code: 'INVALID_ID' });
      return;
    }

    const employee = await User.findById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found', code: 'USER_NOT_FOUND' });
      return;
    }

    const prevStatus = employee.status;
    Object.assign(employee, req.body);
    await employee.save();

    if (prevStatus !== employee.status) {
      await AuditLog.create({
        actorUserId: new Types.ObjectId(req.user!.userId),
        actorRole: 'ADMIN',
        action: employee.status === 'ACTIVE' ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
        ipAddress: req.clientContext?.ipAddress || 'unknown',
        userAgent: req.clientContext?.userAgent || 'unknown',
        sessionId: req.clientContext?.sessionId || 'unknown',
        deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
        timestamp: new Date(),
        reason: `Admin changed status of ${employee.employeeId} from ${prevStatus} to ${employee.status}.`
      });
    }

    const userObj = employee.toObject();
    delete (userObj as any).passwordHash;

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: userObj
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    await authService.resetEmployeePassword(id, newPassword, req.user!.userId, req.clientContext!);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Active sessions for this user have been terminated.'
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await authService.revokeAllSessions(id, req.user!.userId, req.clientContext!);

    res.status(200).json({
      success: true,
      message: 'All active sessions for this employee have been revoked.'
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeAuditHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found', code: 'USER_NOT_FOUND' });
      return;
    }

    const logs = await AuditLog.find({
      $or: [{ actorUserId: employee._id }, { actorEmployeeId: employee.employeeId }]
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        employee: {
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department,
          status: employee.status,
          activeSessions: employee.activeSessions,
          lastLoginAt: employee.lastLoginAt
        },
        logs
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid employee ID', code: 'INVALID_ID' });
      return;
    }

    // Prevent admin from deleting their own account
    if (req.user!.userId === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrator account.',
        code: 'SELF_DELETE_FORBIDDEN'
      });
      return;
    }

    const employee = await User.findById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found', code: 'USER_NOT_FOUND' });
      return;
    }

    const deletedEmployeeId = employee.employeeId;
    const deletedEmployeeName = employee.name;

    // Hard delete the user account
    // AuditLog records are preserved — they store actorEmployeeId (string) snapshot
    // so historical records remain fully intact even after user deletion
    await User.findByIdAndDelete(id);

    // Record deletion audit event before we lose context
    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'ACCOUNT_DEACTIVATED',
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: `Admin permanently deleted employee account "${deletedEmployeeName}" (${deletedEmployeeId}). Historical voting and audit records are preserved.`,
      metadata: { deletedEmployeeId, deletedEmployeeName }
    });

    res.status(200).json({
      success: true,
      message: `Employee "${deletedEmployeeName}" (${deletedEmployeeId}) has been permanently removed. Historical records are preserved.`
    });
  } catch (error) {
    next(error);
  }
}

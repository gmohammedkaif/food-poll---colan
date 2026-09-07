import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { SystemSetting } from '../models/SystemSetting.js';
import { env } from '../config/env.js';

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let settings = await SystemSetting.findOne({ key: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = await SystemSetting.create({
        key: 'GLOBAL_SETTINGS',
        defaultStartTime: env.DEFAULT_POLL_START_TIME,
        defaultEndTime: env.DEFAULT_POLL_END_TIME,
        timezone: env.DEFAULT_TIMEZONE,
        allowVoteChangeDefault: true,
        defaultResultVisibility: 'VOTER_NAMES_VISIBLE',
        maxActiveSessionsPerEmployee: 3,
        autoFlagSuspiciousVotes: true
      });
    }

    const schedule = {
      startTime: settings.defaultStartTime || env.DEFAULT_POLL_START_TIME,
      endTime: settings.defaultEndTime || env.DEFAULT_POLL_END_TIME,
      timezone: settings.timezone || env.DEFAULT_TIMEZONE
    };

    const votingRules = {
      allowVoteChange: settings.allowVoteChangeDefault,
      resultsVisibility: settings.defaultResultVisibility
    };

    const securityRules = {
      autoFlagSuspiciousActivity: settings.autoFlagSuspiciousVotes,
      maxConcurrentSessionsPerUser: settings.maxActiveSessionsPerEmployee
    };

    const formatted = {
      ...settings.toObject(),
      defaultVotingSchedule: schedule,
      votingRules,
      securityRules
    };

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
}

export async function getBranding(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await SystemSetting.findOne({ key: 'GLOBAL_SETTINGS' });
    res.status(200).json({
      success: true,
      data: {
        logoUrl: settings?.logoUrl || '',
        brandName: 'PollHub'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let settings = await SystemSetting.findOne({ key: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = new SystemSetting({ key: 'GLOBAL_SETTINGS' });
    }

    const body = req.body;
    if (body.defaultVotingSchedule) {
      if (body.defaultVotingSchedule.startTime) settings.defaultStartTime = body.defaultVotingSchedule.startTime;
      if (body.defaultVotingSchedule.endTime) settings.defaultEndTime = body.defaultVotingSchedule.endTime;
      if (body.defaultVotingSchedule.timezone) settings.timezone = body.defaultVotingSchedule.timezone;
    }
    if (body.votingRules) {
      if (body.votingRules.allowVoteChange !== undefined) settings.allowVoteChangeDefault = body.votingRules.allowVoteChange;
      if (body.votingRules.resultsVisibility) settings.defaultResultVisibility = body.votingRules.resultsVisibility;
    }
    if (body.securityRules) {
      if (body.securityRules.autoFlagSuspiciousActivity !== undefined) settings.autoFlagSuspiciousVotes = body.securityRules.autoFlagSuspiciousActivity;
      if (body.securityRules.maxConcurrentSessionsPerUser) settings.maxActiveSessionsPerEmployee = body.securityRules.maxConcurrentSessionsPerUser;
    }

    Object.assign(settings, body);
    settings.updatedBy = new Types.ObjectId(req.user!.userId);
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      data: settings
    });
  } catch (error) {
    next(error);
  }
}

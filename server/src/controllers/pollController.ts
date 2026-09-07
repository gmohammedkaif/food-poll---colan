import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Poll } from '../models/Poll.js';
import { Vote } from '../models/Vote.js';
import { AuditLog } from '../models/AuditLog.js';
import * as pollService from '../services/pollService.js';
import { broadcastPollStatusChange } from '../services/socketService.js';
import { sendPollPublishedNotification } from '../services/notificationService.js';
import { env } from '../config/env.js';

export async function getActivePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pollIdParam = req.query.pollId ? String(req.query.pollId) : undefined;
    const [activePollsDocs, pollDoc] = await Promise.all([
      pollService.getActivePolls(),
      pollService.getActivePoll(pollIdParam)
    ]);

    if (!pollDoc && activePollsDocs.length === 0) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No active poll is available at the moment.'
      });
      return;
    }

    const selectedPollDoc = pollDoc || activePollsDocs[0] || null;

    // Collect all poll IDs to fetch real vote counts in a single batch
    const allPollIds: Types.ObjectId[] = activePollsDocs.map((p) => p._id as Types.ObjectId);
    if (selectedPollDoc && !allPollIds.some((id) => id.toString() === selectedPollDoc._id.toString())) {
      allPollIds.push(selectedPollDoc._id as Types.ObjectId);
    }

    const voteCounts = await Vote.aggregate([
      { $match: { pollId: { $in: allPollIds }, active: true } },
      { $group: { _id: '$pollId', count: { $sum: 1 } } }
    ]);
    const voteCountMap = new Map<string, number>();
    for (const vc of voteCounts) {
      voteCountMap.set(vc._id.toString(), vc.count);
    }

    const formatPollWithVotes = (p: any) => {
      if (!p) return null;
      const obj = p.toObject ? p.toObject() : { ...p };
      obj.totalVotes = voteCountMap.get(obj._id.toString()) || 0;
      return obj;
    };

    const selectedPoll = formatPollWithVotes(selectedPollDoc);
    const activePolls = activePollsDocs.map(formatPollWithVotes);

    let myVote = null;
    const myVotes: Record<string, any> = {};

    if (req.user) {
      const votes = await Vote.find({
        pollId: { $in: allPollIds },
        employeeId: req.user.userId,
        active: true
      });

      for (const v of votes) {
        const pId = v.pollId.toString();
        const voteDto = {
          voteId: v._id,
          selectedOptionId: v.selectedOptionId,
          submittedAt: v.submittedAt,
          updatedAt: v.updatedAt
        };
        myVotes[pId] = voteDto;
        if (selectedPoll && pId === selectedPoll._id.toString()) {
          myVote = voteDto;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        poll: selectedPoll,
        polls: activePolls,
        serverTime: new Date().toISOString(),
        myVote,
        myVotes
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllPolls(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Purge any polls older than yesterday from DB
    await pollService.purgeOldPolls();

    const { status, search, page = '1', limit = '20', startDate, endDate } = req.query;

    const zone = env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
    const localNow = DateTime.now().setZone(zone);
    // Retention window: strictly Today and Yesterday
    const yesterdayStart = localNow.minus({ days: 1 }).startOf('day').toJSDate();

    const query: any = {
      pollDate: { $gte: yesterdayStart }
    };

    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: new RegExp(String(search), 'i') },
        { description: new RegExp(String(search), 'i') }
      ];
    }
    if (startDate) {
      const parsedStart = new Date(String(startDate));
      query.pollDate.$gte = parsedStart > yesterdayStart ? parsedStart : yesterdayStart;
    }
    if (endDate) {
      query.pollDate.$lte = new Date(String(endDate));
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [pollsDocs, total] = await Promise.all([
      Poll.find(query)
        .populate('createdBy', 'name employeeId')
        .sort({ pollDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Poll.countDocuments(query)
    ]);

    const pollIds = pollsDocs.map((p) => p._id);
    const voteCounts = await Vote.aggregate([
      { $match: { pollId: { $in: pollIds }, active: true } },
      { $group: { _id: '$pollId', count: { $sum: 1 } } }
    ]);
    const voteCountMap = new Map<string, number>();
    for (const vc of voteCounts) {
      voteCountMap.set(vc._id.toString(), vc.count);
    }

    const polls = pollsDocs.map((p) => {
      const obj = p.toObject();
      obj.totalVotes = voteCountMap.get(obj._id.toString()) || 0;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: {
        polls,
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

export async function getPollById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid poll ID', code: 'INVALID_ID' });
      return;
    }

    const pollDoc = await Poll.findById(id).populate('createdBy', 'name employeeId');
    if (!pollDoc) {
      res.status(404).json({ success: false, message: 'Poll not found', code: 'POLL_NOT_FOUND' });
      return;
    }

    const voteCount = await Vote.countDocuments({ pollId: pollDoc._id, active: true });
    const poll = pollDoc.toObject();
    poll.totalVotes = voteCount;

    let myVote = null;
    if (req.user) {
      myVote = await Vote.findOne({
        pollId: pollDoc._id,
        employeeId: req.user.userId,
        active: true
      });
    }

    res.status(200).json({
      success: true,
      data: {
        poll,
        serverTime: new Date().toISOString(),
        myVote: myVote
          ? {
              voteId: myVote._id,
              selectedOptionId: myVote.selectedOptionId,
              submittedAt: myVote.submittedAt,
              updatedAt: myVote.updatedAt
            }
          : null
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const poll = await pollService.createPoll(req.body, req.user!.userId, req.clientContext);
    res.status(201).json({
      success: true,
      message: 'Poll created successfully.',
      data: poll
    });
  } catch (error: any) {
    next(error);
  }
}

export async function updatePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid poll ID', code: 'INVALID_ID' });
      return;
    }

    const poll = await Poll.findById(id);
    if (!poll) {
      res.status(404).json({ success: false, message: 'Poll not found', code: 'POLL_NOT_FOUND' });
      return;
    }

    if (poll.status === 'ARCHIVED') {
      res.status(400).json({
        success: false,
        message: 'Cannot modify an archived poll.',
        code: 'POLL_IMMUTABLE'
      });
      return;
    }

    if (req.body.title !== undefined) poll.title = req.body.title.trim();
    if (req.body.description !== undefined) poll.description = req.body.description.trim();
    if (req.body.pollDate !== undefined) poll.pollDate = new Date(req.body.pollDate);
    if (req.body.startAt !== undefined) poll.startAt = new Date(req.body.startAt);
    if (req.body.endAt !== undefined) poll.endAt = new Date(req.body.endAt);
    if (req.body.allowVoteChange !== undefined) poll.allowVoteChange = Boolean(req.body.allowVoteChange);
    if (req.body.resultsVisibility !== undefined) poll.resultsVisibility = req.body.resultsVisibility;

    // Recalculate status and handle reopening if cutoff was extended into the future
    const now = new Date();
    if (poll.status !== 'DRAFT') {
      const calculated = pollService.computePollStatus(poll, now, true);
      poll.status = calculated;
      if (calculated === 'OPEN' || calculated === 'SCHEDULED') {
        poll.closedAt = undefined;
      }
    }

    await poll.save();
    broadcastPollStatusChange(poll._id.toString(), poll.status, poll);

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'POLL_UPDATED',
      pollId: poll._id,
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: `Admin updated poll "${poll.title}" (cutoff: ${poll.endAt.toISOString()})`
    });

    res.status(200).json({
      success: true,
      message: 'Poll updated successfully.',
      data: poll
    });
  } catch (error) {
    next(error);
  }
}

export async function publishPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) {
      res.status(404).json({ success: false, message: 'Poll not found', code: 'POLL_NOT_FOUND' });
      return;
    }

    const now = new Date();
    poll.publishedAt = now;
    poll.status = pollService.computePollStatus(poll, now, true);
    await poll.save();

    broadcastPollStatusChange(poll._id.toString(), poll.status, poll);

    if (poll.status === 'OPEN' || poll.status === 'SCHEDULED') {
      sendPollPublishedNotification(poll).catch((err) =>
        console.error('[NotificationService Error] Background push trigger failed in publishPoll:', err)
      );
    }

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'POLL_PUBLISHED',
      pollId: poll._id,
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: now,
      reason: `Poll "${poll.title}" published by admin. Current status: ${poll.status}`
    });

    res.status(200).json({
      success: true,
      message: `Poll published successfully (Status: ${poll.status}).`,
      data: poll
    });
  } catch (error) {
    next(error);
  }
}

export async function closePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) {
      res.status(404).json({ success: false, message: 'Poll not found', code: 'POLL_NOT_FOUND' });
      return;
    }

    const now = new Date();
    poll.status = 'CLOSED';
    poll.closedAt = now;
    await poll.save();

    broadcastPollStatusChange(poll._id.toString(), 'CLOSED', poll);

    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      action: 'POLL_CLOSED',
      pollId: poll._id,
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: now,
      reason: `Poll "${poll.title}" manually closed by admin.`
    });

    res.status(200).json({
      success: true,
      message: 'Poll closed successfully.',
      data: poll
    });
  } catch (error) {
    next(error);
  }
}

export async function getPollResults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid poll ID', code: 'INVALID_ID' });
      return;
    }

    const results = await pollService.getPollResults(id);
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

export async function getPollVoters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid poll ID', code: 'INVALID_ID' });
      return;
    }

    const isAdmin = req.user?.role === 'ADMIN';
    const voters = await pollService.getPollVoters(id, isAdmin);

    res.status(200).json({
      success: true,
      data: voters
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid poll ID', code: 'INVALID_ID' });
      return;
    }

    const poll = await Poll.findById(id);
    if (!poll) {
      res.status(404).json({ success: false, message: 'Poll not found', code: 'POLL_NOT_FOUND' });
      return;
    }

    const pollTitle = poll.title;
    const pollDate = poll.pollDate;

    // 1. Cascade delete all votes belonging strictly to this poll
    const deletedVotesResult = await Vote.deleteMany({ pollId: poll._id });

    // 2. Permanently delete the poll document itself from MongoDB
    await Poll.findByIdAndDelete(poll._id);

    // 3. Record audit trail for administrative tracking
    await AuditLog.create({
      actorUserId: new Types.ObjectId(req.user!.userId),
      actorRole: 'ADMIN',
      pollId: poll._id,
      action: 'POLL_CLOSED',
      ipAddress: req.clientContext?.ipAddress || 'unknown',
      userAgent: req.clientContext?.userAgent || 'unknown',
      sessionId: req.clientContext?.sessionId || 'unknown',
      deviceIdentifier: req.clientContext?.deviceIdentifier || 'unknown',
      timestamp: new Date(),
      reason: `Admin permanently deleted poll "${pollTitle}" and removed ${deletedVotesResult.deletedCount} associated vote record(s).`,
      metadata: { pollTitle, pollDate, deletedVotesCount: deletedVotesResult.deletedCount }
    });

    broadcastPollStatusChange(poll._id.toString(), 'ARCHIVED', { _id: poll._id, isDeleted: true });

    res.status(200).json({
      success: true,
      message: `Poll "${pollTitle}" and associated votes deleted successfully.`,
      data: { deletedPollId: id, deletedVotesCount: deletedVotesResult.deletedCount }
    });
  } catch (error) {
    next(error);
  }
}

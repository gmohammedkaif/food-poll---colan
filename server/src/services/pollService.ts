import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Poll, IPoll, IPollOption } from '../models/Poll.js';
import { Food } from '../models/Food.js';
import { Vote } from '../models/Vote.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { PollStatus, ResultsVisibility, ClientContext } from '../types/index.js';
import { broadcastPollStatusChange } from './socketService.js';
import { sendPollPublishedNotification } from './notificationService.js';
import { env } from '../config/env.js';

export function computePollStatus(poll: IPoll, now: Date = new Date(), forcePublish: boolean = false): PollStatus {
  if (!forcePublish && (poll.status === 'DRAFT' || poll.status === 'ARCHIVED' || poll.status === 'CLOSED')) {
    return poll.status;
  }
  if (poll.status === 'ARCHIVED') {
    return 'ARCHIVED';
  }

  const start = new Date(poll.startAt).getTime();
  const end = new Date(poll.endAt).getTime();
  const current = now.getTime();

  if (current < start) {
    return 'SCHEDULED';
  } else if (current >= start && current < end) {
    return 'OPEN';
  } else {
    return 'CLOSED';
  }
}

export async function purgeOldPolls(): Promise<number> {
  try {
    const zone = env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
    const localNow = DateTime.now().setZone(zone);
    // Retain strictly Today and Yesterday; purge anything before yesterday's start of day
    const yesterdayStart = localNow.minus({ days: 1 }).startOf('day').toJSDate();

    // Find all polls with pollDate before yesterday's start of day
    const oldPolls = await Poll.find({
      pollDate: { $lt: yesterdayStart }
    }).select('_id title pollDate');

    if (oldPolls.length === 0) return 0;

    const oldPollIds = oldPolls.map((p) => p._id);

    // 1. Delete associated votes from database
    await Vote.deleteMany({ pollId: { $in: oldPollIds } });

    // 2. Permanently delete the old polls from database
    const deleteResult = await Poll.deleteMany({ _id: { $in: oldPollIds } });

    console.log(`[PollRetention] Purged ${deleteResult.deletedCount} poll(s) older than yesterday (before ${yesterdayStart.toISOString()}) from database.`);
    return deleteResult.deletedCount || 0;
  } catch (error) {
    console.error('[PollRetention Error] Failed to purge old polls:', error);
    return 0;
  }
}

export async function syncPollStatuses(): Promise<void> {
  const now = new Date();

  // 1. Automatically purge polls older than yesterday as days run
  await purgeOldPolls();

  // 2. Sync statuses of active polls that are SCHEDULED or OPEN
  const activePolls = await Poll.find({
    status: { $in: ['SCHEDULED', 'OPEN'] }
  });

  for (const poll of activePolls) {
    const calculatedStatus = computePollStatus(poll, now);
    if (poll.status !== calculatedStatus && poll.status !== 'ARCHIVED' && poll.status !== 'DRAFT') {
      const prevStatus = poll.status;
      poll.status = calculatedStatus;
      if (calculatedStatus === 'CLOSED' && !poll.closedAt) {
        poll.closedAt = now;
      }
      await poll.save();

      console.log(`[PollService] Poll ${poll._id} transitioned from ${prevStatus} -> ${calculatedStatus}`);
      broadcastPollStatusChange(poll._id.toString(), calculatedStatus, poll);

      // Trigger Web Push notification if transitioning to OPEN
      if (calculatedStatus === 'OPEN') {
        sendPollPublishedNotification(poll).catch((err) =>
          console.error('[NotificationService Error] Background push trigger failed in syncPollStatuses:', err)
        );
      }

      await AuditLog.create({
        actorRole: 'SYSTEM',
        action: calculatedStatus === 'OPEN' ? 'POLL_PUBLISHED' : 'POLL_CLOSED',
        pollId: poll._id,
        timestamp: now,
        reason: `Automated server-time transition to ${calculatedStatus}`,
        metadata: { prevStatus, newStatus: calculatedStatus }
      });
    }
  }
}

export async function getActivePolls(): Promise<IPoll[]> {
  const now = new Date();
  const zone = env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
  const localNow = DateTime.now().setZone(zone);
  const startOfDay = localNow.startOf('day').toJSDate();
  const endOfDay = localNow.endOf('day').toJSDate();

  // Polls that are not DRAFT or ARCHIVED, and are either:
  // 1. currently open within their voting window
  // 2. scheduled or closed for today
  const polls = await Poll.find({
    status: { $nin: ['DRAFT', 'ARCHIVED'] },
    $or: [
      { startAt: { $lte: now }, endAt: { $gt: now } },
      { pollDate: { $gte: startOfDay, $lte: endOfDay } }
    ]
  }).sort({ startAt: 1, createdAt: -1 });

  for (const poll of polls) {
    if (poll.status !== 'CLOSED') {
      const computed = computePollStatus(poll, now);
      if (poll.status !== computed && poll.status !== 'ARCHIVED' && poll.status !== 'DRAFT') {
        poll.status = computed;
        await poll.save();
      }
    }
  }

  return polls;
}

export async function getActivePoll(pollId?: string): Promise<IPoll | null> {
  const now = new Date();
  const zone = env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
  const localNow = DateTime.now().setZone(zone);
  const startOfDay = localNow.startOf('day').toJSDate();
  const endOfDay = localNow.endOf('day').toJSDate();

  if (pollId && Types.ObjectId.isValid(pollId)) {
    const poll = await Poll.findOne({
      _id: pollId,
      status: { $nin: ['DRAFT', 'ARCHIVED'] }
    });
    if (poll) {
      if (poll.status !== 'CLOSED') {
        const computed = computePollStatus(poll, now);
        if (poll.status !== computed && poll.status !== 'ARCHIVED' && poll.status !== 'DRAFT') {
          poll.status = computed;
          await poll.save();
        }
      }
      return poll;
    }
  }

  // 1. Find currently OPEN poll (within startAt and endAt)
  let poll = await Poll.findOne({
    status: 'OPEN',
    startAt: { $lte: now },
    endAt: { $gt: now }
  }).sort({ startAt: -1 });

  // 2. If no OPEN poll right now, check for upcoming SCHEDULED poll today
  if (!poll) {
    poll = await Poll.findOne({
      status: 'SCHEDULED',
      startAt: { $gt: now },
      pollDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startAt: 1 });
  }

  // 3. If none OPEN and none SCHEDULED, check most recent poll for today
  if (!poll) {
    poll = await Poll.findOne({
      status: { $nin: ['DRAFT', 'ARCHIVED'] },
      pollDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ endAt: -1, createdAt: -1 });
  }

  if (poll && poll.status !== 'CLOSED') {
    const computed = computePollStatus(poll, now);
    if (poll.status !== computed && poll.status !== 'ARCHIVED' && poll.status !== 'DRAFT') {
      poll.status = computed;
      await poll.save();
    }
  }

  return poll;
}

export interface CreatePollInput {
  title: string;
  description?: string;
  pollDate: string | Date;
  startAt: string | Date;
  endAt: string | Date;
  status?: PollStatus;
  initialStatus?: PollStatus;
  allowVoteChange?: boolean;
  resultsVisibility?: ResultsVisibility;
  options: {
    foodId?: string;
    foodName: string;
    foodImage: string;
    description?: string;
  }[];
}

export async function createPoll(
  data: CreatePollInput,
  adminUserId: string,
  clientContext?: ClientContext
): Promise<IPoll> {
  if (!data.options || data.options.length < 2) {
    throw new Error('A lunch poll must have at least 2 food options.');
  }

  const start = new Date(data.startAt);
  const end = new Date(data.endAt);

  if (end.getTime() <= start.getTime()) {
    throw new Error('Poll end time must be after poll start time.');
  }

  // Build immutable snapshot for options
  const optionSnapshots: IPollOption[] = [];
  for (let i = 0; i < data.options.length; i++) {
    const opt = data.options[i];
    let foodSnapName = opt.foodName;
    let foodSnapImage = opt.foodImage;
    let foodSnapDesc = opt.description || '';

    if (opt.foodId && Types.ObjectId.isValid(opt.foodId)) {
      const foodItem = await Food.findById(opt.foodId);
      if (foodItem) {
        foodSnapName = foodItem.name;
        foodSnapImage = foodItem.imageUrl;
        foodSnapDesc = foodItem.description || foodSnapDesc;
      }
    }

    optionSnapshots.push({
      foodId: opt.foodId && Types.ObjectId.isValid(opt.foodId) ? new Types.ObjectId(opt.foodId) : undefined,
      foodNameSnapshot: foodSnapName,
      foodImageSnapshot: foodSnapImage,
      descriptionSnapshot: foodSnapDesc,
      displayOrder: i
    });
  }

  const requestedStatus: PollStatus = data.status || data.initialStatus || 'DRAFT';
  const isPublished = requestedStatus !== 'DRAFT';
  let resolvedStatus: PollStatus = 'DRAFT';

  if (isPublished) {
    resolvedStatus = computePollStatus(
      { startAt: start, endAt: end, status: requestedStatus } as any,
      new Date(),
      true
    );
  }

  const poll = new Poll({
    title: data.title || "Today's Lunch Poll",
    description: data.description || 'Choose your lunch preference for today',
    pollDate: new Date(data.pollDate),
    startAt: start,
    endAt: end,
    status: resolvedStatus,
    options: optionSnapshots,
    allowVoteChange: data.allowVoteChange ?? true,
    resultsVisibility: data.resultsVisibility || 'VOTER_NAMES_VISIBLE',
    createdBy: new Types.ObjectId(adminUserId),
    publishedAt: isPublished ? new Date() : undefined
  });

  await poll.save();

  if (isPublished) {
    broadcastPollStatusChange(poll._id.toString(), poll.status, poll);
    if (poll.status === 'OPEN' || poll.status === 'SCHEDULED') {
      sendPollPublishedNotification(poll).catch((err) =>
        console.error('[NotificationService Error] Background push trigger failed in createPoll:', err)
      );
    }
  }

  await AuditLog.create({
    actorUserId: new Types.ObjectId(adminUserId),
    actorRole: 'ADMIN',
    action: 'POLL_CREATED',
    pollId: poll._id,
    ipAddress: clientContext?.ipAddress || 'unknown',
    userAgent: clientContext?.userAgent || 'unknown',
    sessionId: clientContext?.sessionId || 'unknown',
    deviceIdentifier: clientContext?.deviceIdentifier || 'unknown',
    timestamp: new Date(),
    reason: `Created poll: "${poll.title}" with ${poll.options.length} options.`,
    metadata: { optionsCount: poll.options.length, status: poll.status }
  });

  return poll;
}

export interface PollResultsData {
  pollId: string;
  title: string;
  status: PollStatus;
  startAt: Date;
  endAt: Date;
  allowVoteChange: boolean;
  resultsVisibility: ResultsVisibility;
  totalVotes: number;
  totalEmployees: number;
  participationRate: number;
  leadingOption?: {
    optionId: string;
    foodName: string;
    foodImage: string;
    voteCount: number;
    percentage: number;
  };
  options: {
    optionId: string;
    foodName: string;
    foodImage: string;
    description: string;
    voteCount: number;
    percentage: number;
  }[];
}

export async function getPollResults(pollId: string): Promise<PollResultsData> {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new Error('Poll not found');
  }

  // Update status if needed
  if (poll.status !== 'CLOSED') {
    const computed = computePollStatus(poll, new Date());
    if (poll.status !== computed && poll.status !== 'ARCHIVED' && poll.status !== 'DRAFT') {
      poll.status = computed;
      await poll.save();
    }
  }

  const [votes, totalEmployees] = await Promise.all([
    Vote.find({ pollId: poll._id, active: true }),
    User.countDocuments({ role: 'EMPLOYEE', status: 'ACTIVE' })
  ]);

  const totalVotes = votes.length;
  const participationRate = totalEmployees > 0 ? Math.round((totalVotes / totalEmployees) * 100) : 0;

  // Aggregate option counts
  const voteCountMap = new Map<string, number>();
  for (const vote of votes) {
    const optIdStr = vote.selectedOptionId.toString();
    voteCountMap.set(optIdStr, (voteCountMap.get(optIdStr) || 0) + 1);
  }

  let leadingOption: PollResultsData['leadingOption'] | undefined = undefined;
  let maxCount = -1;

  const optionResults = poll.options.map((opt) => {
    const optIdStr = opt._id!.toString();
    const count = voteCountMap.get(optIdStr) || 0;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

    if (count > maxCount && count > 0) {
      maxCount = count;
      leadingOption = {
        optionId: optIdStr,
        foodName: opt.foodNameSnapshot,
        foodImage: opt.foodImageSnapshot,
        voteCount: count,
        percentage
      };
    }

    return {
      optionId: optIdStr,
      foodName: opt.foodNameSnapshot,
      foodImage: opt.foodImageSnapshot,
      description: opt.descriptionSnapshot || '',
      voteCount: count,
      percentage
    };
  });

  return {
    pollId: poll._id.toString(),
    title: poll.title,
    status: poll.status,
    startAt: poll.startAt,
    endAt: poll.endAt,
    allowVoteChange: poll.allowVoteChange,
    resultsVisibility: poll.resultsVisibility,
    totalVotes,
    totalEmployees,
    participationRate,
    leadingOption,
    options: optionResults
  };
}

export interface VoterItem {
  employeeId: string;
  employeeName: string;
  department?: string;
  selectedOptionId: string;
  selectedOptionName: string;
  submittedAt: Date;
  updatedAt: Date;
  // Admin-only fields:
  ipAddress?: string;
  deviceIdentifier?: string;
  sessionId?: string;
}

export async function getPollVoters(pollId: string, isAdmin: boolean): Promise<VoterItem[]> {
  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new Error('Poll not found');
  }

  if (!isAdmin && poll.resultsVisibility === 'ADMIN_ONLY') {
    throw new Error('Results and voter details are restricted to administrators.');
  }

  const votes = await Vote.find({ pollId: poll._id, active: true })
    .populate<{ employeeId: { _id: Types.ObjectId; employeeId: string; name: string; department?: string } }>(
      'employeeId',
      'employeeId name department'
    )
    .sort({ updatedAt: -1 });

  const optionMap = new Map<string, string>();
  for (const opt of poll.options) {
    optionMap.set(opt._id!.toString(), opt.foodNameSnapshot);
  }

  return votes.map((vote) => {
    const emp = vote.employeeId as any;
    const optIdStr = vote.selectedOptionId.toString();
    const optName = optionMap.get(optIdStr) || 'Unknown Option';

    const item: VoterItem = {
      employeeId: emp?.employeeId || vote.employeeIdSnapshot || 'Former Employee',
      employeeName: emp?.name || vote.employeeNameSnapshot || 'Former Employee',
      department: emp?.department || vote.departmentSnapshot,
      selectedOptionId: optIdStr,
      selectedOptionName: optName,
      submittedAt: vote.submittedAt,
      updatedAt: vote.updatedAt
    };

    if (isAdmin) {
      item.ipAddress = vote.ipAddress;
      item.deviceIdentifier = vote.deviceIdentifier;
      item.sessionId = vote.currentSessionId;
    }

    return item;
  });
}

import { Types } from 'mongoose';
import { Poll } from '../models/Poll.js';
import { Vote, IVote } from '../models/Vote.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { SecurityAlert } from '../models/SecurityAlert.js';
import { ClientContext } from '../types/index.js';
import { computePollStatus, getPollResults } from './pollService.js';
import { broadcastVoteUpdate, broadcastSecurityAlert } from './socketService.js';

export interface CastVoteInput {
  pollId: string;
  selectedOptionId: string;
}

export interface VoteResult {
  vote: IVote;
  isUpdate: boolean;
  selectedOptionName: string;
  previousOptionName?: string;
  pollTitle: string;
  closingTime: Date;
  allowVoteChange: boolean;
}

export async function castVote(
  input: CastVoteInput,
  userId: string,
  clientContext: ClientContext
): Promise<VoteResult> {
  const now = new Date();
  const poll = await Poll.findById(input.pollId);

  if (!poll) {
    throw { status: 404, message: 'Poll not found.', code: 'POLL_NOT_FOUND' };
  }

  const user = await User.findById(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw { status: 403, message: 'Employee account is inactive or not found.', code: 'ACCOUNT_INACTIVE' };
  }

  if (user.role === 'ADMIN' || (user as any).role === 'SUPER_ADMIN') {
    throw {
      status: 403,
      message: 'Administrators cannot cast votes. Food voting is exclusively reserved for employees.',
      code: 'ADMIN_CANNOT_VOTE'
    };
  }

  // 1. Strict Server-side Time & Status Validation
  const status = computePollStatus(poll, now);
  if (status !== 'OPEN' || now.getTime() < new Date(poll.startAt).getTime() || now.getTime() >= new Date(poll.endAt).getTime()) {
    // Log audit record for rejected late attempt
    await AuditLog.create({
      actorUserId: user._id,
      actorEmployeeId: user.employeeId,
      actorRole: 'EMPLOYEE',
      action: 'POLL_CLOSED_VOTE_ATTEMPT',
      pollId: poll._id,
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      sessionId: clientContext.sessionId,
      deviceIdentifier: clientContext.deviceIdentifier,
      timestamp: now,
      reason: `Vote rejected: Poll is closed (Server Time: ${now.toISOString()}, End Time: ${poll.endAt.toISOString()})`
    });

    throw {
      status: 400,
      message: 'Voting has closed for this poll. Submissions are no longer accepted.',
      code: 'POLL_CLOSED'
    };
  }

  // 2. Validate Option exists in snapshot
  const option = poll.options.find((opt) => opt._id!.toString() === input.selectedOptionId);
  if (!option) {
    throw { status: 400, message: 'Invalid food option selected.', code: 'INVALID_OPTION' };
  }

  // 3. Find existing vote for this employee on this poll
  const existingVote = await Vote.findOne({
    pollId: poll._id,
    employeeId: user._id
  });

  const selectedOptId = new Types.ObjectId(input.selectedOptionId);

  if (!existingVote) {
    // Brand new vote submission
    const newVote = await Vote.create({
      pollId: poll._id,
      employeeId: user._id,
      employeeIdSnapshot: user.employeeId,
      employeeNameSnapshot: user.name,
      departmentSnapshot: user.department || '',
      selectedOptionId: selectedOptId,
      submittedAt: now,
      updatedAt: now,
      active: true,
      currentSessionId: clientContext.sessionId,
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      deviceIdentifier: clientContext.deviceIdentifier
    });

    // Record immutable audit log
    await AuditLog.create({
      actorUserId: user._id,
      actorEmployeeId: user.employeeId,
      actorRole: 'EMPLOYEE',
      action: 'VOTE_CREATED',
      pollId: poll._id,
      voteId: newVote._id,
      newOptionId: selectedOptId,
      newOptionName: option.foodNameSnapshot,
      ipAddress: clientContext.ipAddress,
      userAgent: clientContext.userAgent,
      sessionId: clientContext.sessionId,
      deviceIdentifier: clientContext.deviceIdentifier,
      timestamp: now,
      reason: `Initial vote submitted for "${option.foodNameSnapshot}"`
    });

    // Broadcast live results
    const results = await getPollResults(poll._id.toString());
    broadcastVoteUpdate(poll._id.toString(), results);

    return {
      vote: newVote,
      isUpdate: false,
      selectedOptionName: option.foodNameSnapshot,
      pollTitle: poll.title,
      closingTime: poll.endAt,
      allowVoteChange: poll.allowVoteChange
    };
  }

  // Existing Vote Update Flow
  if (!poll.allowVoteChange) {
    throw {
      status: 400,
      message: 'Vote modifications are not permitted for this poll.',
      code: 'VOTE_CHANGE_DISABLED'
    };
  }

  // If same option selected, no-op
  if (existingVote.selectedOptionId.toString() === input.selectedOptionId) {
    return {
      vote: existingVote,
      isUpdate: true,
      selectedOptionName: option.foodNameSnapshot,
      pollTitle: poll.title,
      closingTime: poll.endAt,
      allowVoteChange: poll.allowVoteChange
    };
  }

  // Find previous option name for audit log
  const prevOption = poll.options.find(
    (opt) => opt._id!.toString() === existingVote.selectedOptionId.toString()
  );
  const prevOptionName = prevOption ? prevOption.foodNameSnapshot : 'Previous Option';

  // =========================================================================
  // ANTI-CREDENTIAL-MISUSE / SUSPICIOUS ACTIVITY ENGINE
  // Check if session ID, device identifier, or IP differs from original vote
  // =========================================================================
  const isDifferentSession = existingVote.currentSessionId !== clientContext.sessionId;
  const isDifferentDevice = existingVote.deviceIdentifier !== clientContext.deviceIdentifier;
  const isDifferentIP = existingVote.ipAddress !== clientContext.ipAddress;

  let suspiciousReason = '';
  if (isDifferentSession || isDifferentDevice) {
    suspiciousReason = `Vote modified from divergent session/device (Original Session: ${existingVote.currentSessionId}, Current: ${clientContext.sessionId}, Device: ${clientContext.deviceIdentifier})`;

    // Generate security alert for admin review
    const alert = await SecurityAlert.create({
      severity: 'HIGH',
      type: 'VOTE_MODIFIED_FROM_NEW_SESSION',
      employeeId: user._id,
      employeeIdString: user.employeeId,
      pollId: poll._id,
      description: `Vote changed for employee ${user.name} (${user.employeeId}) from a new session / device signal.`,
      details: {
        originalOption: prevOptionName,
        newOption: option.foodNameSnapshot,
        originalSessionId: existingVote.currentSessionId,
        newSessionId: clientContext.sessionId,
        originalDevice: existingVote.deviceIdentifier,
        newDevice: clientContext.deviceIdentifier,
        originalIP: existingVote.ipAddress,
        newIP: clientContext.ipAddress,
        time: now
      }
    });

    broadcastSecurityAlert(alert);
  }

  // Atomic vote update
  existingVote.selectedOptionId = selectedOptId;
  existingVote.employeeIdSnapshot = user.employeeId;
  existingVote.employeeNameSnapshot = user.name;
  existingVote.departmentSnapshot = user.department || '';
  existingVote.updatedAt = now;
  existingVote.currentSessionId = clientContext.sessionId;
  existingVote.ipAddress = clientContext.ipAddress;
  existingVote.userAgent = clientContext.userAgent;
  existingVote.deviceIdentifier = clientContext.deviceIdentifier;
  await existingVote.save();

  // Immutable audit log
  await AuditLog.create({
    actorUserId: user._id,
    actorEmployeeId: user.employeeId,
    actorRole: 'EMPLOYEE',
    action: 'VOTE_UPDATED',
    pollId: poll._id,
    voteId: existingVote._id,
    previousOptionId: prevOption ? (prevOption._id as Types.ObjectId) : undefined,
    previousOptionName: prevOptionName,
    newOptionId: selectedOptId,
    newOptionName: option.foodNameSnapshot,
    ipAddress: clientContext.ipAddress,
    userAgent: clientContext.userAgent,
    sessionId: clientContext.sessionId,
    deviceIdentifier: clientContext.deviceIdentifier,
    timestamp: now,
    reason: suspiciousReason || `Vote updated from "${prevOptionName}" to "${option.foodNameSnapshot}"`,
    metadata: {
      isSessionDivergent: isDifferentSession,
      isDeviceDivergent: isDifferentDevice,
      isIPDivergent: isDifferentIP
    }
  });

  // Broadcast live results
  const results = await getPollResults(poll._id.toString());
  broadcastVoteUpdate(poll._id.toString(), results);

  return {
    vote: existingVote,
    isUpdate: true,
    selectedOptionName: option.foodNameSnapshot,
    previousOptionName: prevOptionName,
    pollTitle: poll.title,
    closingTime: poll.endAt,
    allowVoteChange: poll.allowVoteChange
  };
}

export async function getEmployeeVoteForPoll(pollId: string, userId: string): Promise<IVote | null> {
  const user = await User.findById(userId);
  if (user?.role === 'ADMIN' || (user as any)?.role === 'SUPER_ADMIN') {
    return null;
  }
  return Vote.findOne({ pollId, employeeId: userId, active: true });
}

export async function getEmployeeVoteHistory(userId: string): Promise<any[]> {
  const user = await User.findById(userId);
  if (user?.role === 'ADMIN' || (user as any)?.role === 'SUPER_ADMIN') {
    return [];
  }
  const votes = await Vote.find({ employeeId: userId, active: true })
    .populate('pollId', 'title pollDate startAt endAt status options')
    .sort({ createdAt: -1 });

  return votes.map((vote) => {
    const poll = vote.pollId as any;
    if (!poll) return null;
    const opt = poll.options?.find((o: any) => o._id.toString() === vote.selectedOptionId.toString());
    return {
      voteId: vote._id,
      pollId: poll._id,
      pollTitle: poll.title,
      pollDate: poll.pollDate,
      selectedOptionName: opt?.foodNameSnapshot || 'Unknown Dish',
      selectedOptionImage: opt?.foodImageSnapshot || '',
      submittedAt: vote.submittedAt,
      updatedAt: vote.updatedAt
    };
  }).filter(Boolean);
}

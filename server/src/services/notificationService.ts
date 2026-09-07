import webpush from 'web-push';
import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { PushSubscription, IPushSubscription } from '../models/PushSubscription.js';
import { User } from '../models/User.js';
import { IPoll } from '../models/Poll.js';
import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';
import { ClientContext } from '../types/index.js';

// Initialize VAPID details if configured
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    console.log('[NotificationService] VAPID configuration initialized successfully.');
  } catch (err) {
    console.error('[NotificationService] Failed to initialize VAPID configuration:', err);
  }
} else {
  console.warn('[NotificationService] Warning: VAPID keys not fully configured.');
}

export interface SubscribeInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceType?: string;
  browser?: string;
}

/**
 * Register or update a push subscription for an authenticated employee.
 * Multiple devices/browsers per employee are supported.
 */
export async function subscribeEmployee(
  employeeId: string,
  input: SubscribeInput,
  clientContext?: ClientContext
): Promise<IPushSubscription> {
  if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
    throw new Error('Invalid push subscription payload: missing endpoint or cryptographic keys.');
  }

  const userId = new Types.ObjectId(employeeId);
  const now = new Date();

  // Deduce browser & device info if available
  const ua = input.userAgent || clientContext?.userAgent || '';
  let browser = input.browser || 'Unknown';
  let deviceType = input.deviceType || 'desktop';

  if (ua) {
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      deviceType = 'mobile';
    }
  }

  // Upsert by endpoint to prevent duplicates across reconnects
  let subscription = await PushSubscription.findOne({ endpoint: input.endpoint });

  if (subscription) {
    subscription.employeeId = userId;
    subscription.keys = input.keys;
    subscription.userAgent = ua;
    subscription.browser = browser;
    subscription.deviceType = deviceType;
    subscription.isActive = true;
    subscription.lastUsedAt = now;
    await subscription.save();
  } else {
    subscription = await PushSubscription.create({
      employeeId: userId,
      endpoint: input.endpoint,
      keys: input.keys,
      userAgent: ua,
      browser,
      deviceType,
      isActive: true,
      lastUsedAt: now
    });

    await AuditLog.create({
      actorUserId: userId,
      actorRole: 'EMPLOYEE',
      action: 'PUSH_SUBSCRIPTION_CREATED',
      ipAddress: clientContext?.ipAddress || 'unknown',
      userAgent: ua || 'unknown',
      sessionId: clientContext?.sessionId || 'unknown',
      deviceIdentifier: clientContext?.deviceIdentifier || 'unknown',
      timestamp: now,
      reason: `Push notification subscription activated on ${browser} (${deviceType})`
    });
  }

  return subscription;
}

/**
 * Unsubscribe / deactivate a push subscription for an employee.
 */
export async function unsubscribeEmployee(
  employeeId: string,
  endpoint?: string,
  clientContext?: ClientContext
): Promise<{ modifiedCount: number }> {
  const userId = new Types.ObjectId(employeeId);
  const query: any = { employeeId: userId };
  if (endpoint) {
    query.endpoint = endpoint;
  }

  const result = await PushSubscription.updateMany(query, {
    $set: { isActive: false, lastUsedAt: new Date() }
  });

  await AuditLog.create({
    actorUserId: userId,
    actorRole: 'EMPLOYEE',
    action: 'PUSH_SUBSCRIPTION_REMOVED',
    ipAddress: clientContext?.ipAddress || 'unknown',
    userAgent: clientContext?.userAgent || 'unknown',
    sessionId: clientContext?.sessionId || 'unknown',
    deviceIdentifier: clientContext?.deviceIdentifier || 'unknown',
    timestamp: new Date(),
    reason: `Push notification subscription deactivated (${result.modifiedCount} subscription(s))`
  });

  return { modifiedCount: result.modifiedCount };
}

/**
 * Check if the authenticated employee has active push subscriptions.
 */
export async function getEmployeePushStatus(employeeId: string): Promise<{ isSubscribed: boolean; count: number }> {
  const count = await PushSubscription.countDocuments({
    employeeId: new Types.ObjectId(employeeId),
    isActive: true
  });
  return { isSubscribed: count > 0, count };
}

/**
 * Send a web push notification payload to a single subscription.
 * Cleans up invalid/expired subscriptions automatically (404/410).
 */
export async function sendPushToSubscription(
  subscription: IPushSubscription,
  payload: string
): Promise<boolean> {
  try {
    const pushSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };

    await webpush.sendNotification(pushSub, payload);
    return true;
  } catch (error: any) {
    const statusCode = error?.statusCode;
    // 404 (Not Found) or 410 (Gone) indicates expired/invalid registration
    if (statusCode === 404 || statusCode === 410) {
      console.log(`[NotificationService] Subscription expired/invalid (${statusCode}). Deactivating endpoint: ${subscription.endpoint.slice(0, 40)}...`);
      await PushSubscription.updateOne(
        { _id: subscription._id },
        { $set: { isActive: false, lastUsedAt: new Date() } }
      );
    } else {
      console.error('[NotificationService] Push delivery error:', error?.message || error);
    }
    return false;
  }
}

/**
 * Send a Web Push Notification to all active eligible employees when a food poll is published.
 * Fully idempotent: Only triggers once per poll via `poll.notificationSentAt`.
 * Never blocks or fails poll operations.
 */
export async function sendPollPublishedNotification(poll: IPoll): Promise<void> {
  try {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
      console.warn('[NotificationService] VAPID keys not set. Skipping web push delivery.');
      return;
    }

    // 1. Idempotency Check: Don't re-send if already triggered
    if (poll.notificationSentAt) {
      console.log(`[NotificationService] Push notification already sent for poll "${poll.title}" on ${poll.notificationSentAt.toISOString()}. Skipping.`);
      return;
    }

    // 2. Format cutoff time in human-friendly format
    const zone = env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
    const endDateTime = DateTime.fromJSDate(new Date(poll.endAt)).setZone(zone);
    const formattedCutoff = endDateTime.toFormat('h:mm a');

    // 3. Construct Notification Payload
    const notificationTitle = poll.title.includes('Live')
      ? `🍛 ${poll.title}`
      : `🍛 ${poll.title} is Live!`;

    const notificationBody = `Your lunch poll is ready. Choose your food before ${formattedCutoff}.`;

    const payloadObj = {
      title: notificationTitle,
      body: notificationBody,
      icon: '/logo.png',
      badge: '/favicon.png',
      tag: `poll-${poll._id.toString()}`,
      data: {
        type: 'POLL_PUBLISHED',
        pollId: poll._id.toString(),
        url: `/poll/${poll._id.toString()}`,
        endAt: poll.endAt
      }
    };

    const payloadString = JSON.stringify(payloadObj);

    // 4. Find all active eligible employees (strictly EMPLOYEE role, ACTIVE status)
    const eligibleEmployees = await User.find({
      role: 'EMPLOYEE',
      status: 'ACTIVE'
    }).select('_id');

    if (eligibleEmployees.length === 0) {
      console.log('[NotificationService] No eligible active employees found for push delivery.');
      return;
    }

    const employeeIds = eligibleEmployees.map((e) => e._id);

    // 5. Query all active push subscriptions for these employees
    const subscriptions = await PushSubscription.find({
      employeeId: { $in: employeeIds },
      isActive: true
    });

    if (subscriptions.length === 0) {
      console.log(`[NotificationService] No active push subscriptions found for ${eligibleEmployees.length} eligible employee(s).`);
      // Mark as notified so we don't spam attempts later
      poll.notificationSentAt = new Date();
      await poll.save();
      return;
    }

    console.log(`[NotificationService] Dispatching Web Push to ${subscriptions.length} active subscription(s) across ${eligibleEmployees.length} employee(s)...`);

    // 6. Deliver concurrently with Promise.allSettled
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushToSubscription(sub, payloadString))
    );

    const deliveredCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
    const failedCount = subscriptions.length - deliveredCount;

    console.log(`[NotificationService] Push delivery completed: ${deliveredCount} sent, ${failedCount} failed/expired.`);

    // 7. Mark notificationSentAt on Poll
    poll.notificationSentAt = new Date();
    await poll.save();

    // 8. Log Audit Record
    await AuditLog.create({
      actorRole: 'SYSTEM',
      action: 'POLL_NOTIFICATION_TRIGGERED',
      pollId: poll._id,
      timestamp: new Date(),
      reason: `Web push notification sent for "${poll.title}". (${deliveredCount} delivered, ${failedCount} failed/deactivated)`
    });
  } catch (error) {
    console.error('[NotificationService Error] Unexpected failure in sendPollPublishedNotification:', error);
  }
}

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import * as notificationService from '../services/notificationService.js';

/**
 * GET /api/notifications/vapid-key
 * Returns the VAPID public key needed by the browser to create a PushSubscription.
 * Never exposes the private key.
 */
export async function getVapidPublicKey(_req: Request, res: Response): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY) {
    res.status(500).json({
      success: false,
      message: 'VAPID public key is not configured on server.',
      code: 'VAPID_NOT_CONFIGURED'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      publicKey: env.VAPID_PUBLIC_KEY
    }
  });
}

/**
 * POST /api/notifications/subscribe
 * Registers or updates a push subscription for the authenticated user.
 * Strictly uses authenticated `req.user.userId` to ensure user ownership.
 */
export async function subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { endpoint, keys, userAgent, deviceType, browser } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription payload. Must include endpoint and keys (p256dh, auth).',
        code: 'INVALID_SUBSCRIPTION'
      });
      return;
    }

    const subscription = await notificationService.subscribeEmployee(
      userId,
      { endpoint, keys, userAgent, deviceType, browser },
      req.clientContext
    );

    res.status(200).json({
      success: true,
      message: 'Push notification subscription activated successfully.',
      data: {
        id: subscription._id,
        endpoint: subscription.endpoint,
        isActive: subscription.isActive
      }
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * POST /api/notifications/unsubscribe
 * Deactivates push notifications for the authenticated user / endpoint.
 */
export async function unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { endpoint } = req.body;

    const result = await notificationService.unsubscribeEmployee(
      userId,
      endpoint,
      req.clientContext
    );

    res.status(200).json({
      success: true,
      message: 'Push notification subscription removed.',
      data: result
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * GET /api/notifications/status
 * Returns push subscription status for current authenticated employee.
 */
export async function getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const status = await notificationService.getEmployeePushStatus(userId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error: any) {
    next(error);
  }
}

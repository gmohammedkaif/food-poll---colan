import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.js';
import { useToast } from '../components/ui/Toast.js';
import {
  isPushNotificationSupported,
  getPushNotificationStatus,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  registerServiceWorker
} from '../services/pushNotificationService.js';

interface PushNotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  isPromptDismissed: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
  dismissPrompt: () => void;
  refreshStatus: () => Promise<void>;
}

const PushNotificationContext = createContext<PushNotificationContextType | null>(null);

const PROMPT_DISMISS_KEY = 'pollhub_push_prompt_dismissed_at';

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    return !!localStorage.getItem(PROMPT_DISMISS_KEY);
  });

  const refreshStatus = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setIsSupported(false);
      setPermission('unsupported');
      setIsSubscribed(false);
      return;
    }

    setIsSupported(true);
    try {
      const status = await getPushNotificationStatus();
      setPermission(status.permission);
      setIsSubscribed(status.isSubscribed);

      // If user previously granted permission, ensure service worker is registered
      if (status.permission === 'granted' && isAuthenticated) {
        await registerServiceWorker();
      }
    } catch (err) {
      console.warn('[PushNotificationContext] Status check error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus, isAuthenticated, user]);

  const enableNotifications = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await subscribeToPushNotifications();
      if (result.success) {
        success('Notifications Enabled', 'You will receive push notifications when new food polls are published.');
        await refreshStatus();
        return true;
      } else {
        if (result.message?.includes('blocked')) {
          toastError('Notifications Blocked', result.message);
        } else if (result.message?.includes('dismissed')) {
          info('Notification Prompt', 'You can enable notifications anytime from the bell menu.');
        } else {
          toastError('Push Setup', result.message || 'Could not enable push notifications.');
        }
        await refreshStatus();
        return false;
      }
    } catch (err: any) {
      toastError('Push Error', err.message || 'An unexpected error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await unsubscribeFromPushNotifications();
      if (result.success) {
        info('Notifications Disabled', 'You will no longer receive food poll push notifications.');
        await refreshStatus();
        return true;
      } else {
        toastError('Push Error', result.message || 'Could not disable notifications.');
        return false;
      }
    } catch (err: any) {
      toastError('Push Error', err.message || 'An unexpected error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem(PROMPT_DISMISS_KEY, new Date().toISOString());
    setIsPromptDismissed(true);
  };

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        isPromptDismissed,
        enableNotifications,
        disableNotifications,
        dismissPrompt,
        refreshStatus
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotifications = (): PushNotificationContextType => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
};

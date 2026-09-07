import React from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { usePushNotifications } from '../../context/PushNotificationContext.js';
import { Button } from '../ui/Button.js';

export const NotificationPromptBanner: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isPromptDismissed,
    isLoading,
    enableNotifications,
    dismissPrompt
  } = usePushNotifications();

  // Only show when push is supported, permission not yet decided, not subscribed, and not dismissed
  if (!isSupported || permission !== 'default' || isSubscribed || isPromptDismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5 shadow-lg shadow-blue-600/15 animate-fade-in border border-blue-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
            <Bell className="w-5 h-5 text-white animate-bounce-short" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold font-display tracking-tight text-white">
                Don't miss today's food poll!
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
                Push Alert
              </span>
            </div>
            <p className="text-xs text-blue-100/90 leading-relaxed max-w-xl">
              Get notified the moment lunch voting goes live so you never miss your favorite meal — even when PollHub is closed.
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={dismissPrompt}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            Not now
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={enableNotifications}
            isLoading={isLoading}
            className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-sm"
            leftIcon={<Bell className="w-3.5 h-3.5 text-blue-600" />}
          >
            Enable Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

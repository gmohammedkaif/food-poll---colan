import React from 'react';
import { Badge } from '../ui/Badge.js';
import { PollStatus } from '../../types/index.js';

interface PollStatusBadgeProps {
  status: PollStatus;
  size?: 'sm' | 'md';
}

export const PollStatusBadge: React.FC<PollStatusBadgeProps> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'OPEN':
      return (
        <Badge variant="emerald" size={size} dot>
          Live
        </Badge>
      );
    case 'SCHEDULED':
      return (
        <Badge variant="blue" size={size} dot>
          Scheduled
        </Badge>
      );
    case 'CLOSED':
      return (
        <Badge variant="charcoal" size={size}>
          Ended
        </Badge>
      );
    case 'DRAFT':
      return (
        <Badge variant="amber" size={size}>
          Draft
        </Badge>
      );
    case 'ARCHIVED':
      return (
        <Badge variant="charcoal" size={size}>
          Archived
        </Badge>
      );
    default:
      return null;
  }
};

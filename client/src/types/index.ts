export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type PollStatus = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

export type ResultsVisibility =
  | 'PUBLIC_RESULTS'
  | 'VOTER_NAMES_VISIBLE'
  | 'RESULTS_ONLY'
  | 'ADMIN_ONLY';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  activeSessionsCount?: number;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Food {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageFileId?: string;
  category?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  _id: string;
  foodId?: string;
  foodNameSnapshot: string;
  foodImageSnapshot: string;
  descriptionSnapshot?: string;
  displayOrder: number;
}

export interface Poll {
  _id: string;
  title: string;
  description?: string;
  pollDate: string;
  startAt: string;
  endAt: string;
  status: PollStatus;
  options: PollOption[];
  allowVoteChange: boolean;
  resultsVisibility: ResultsVisibility;
  totalVotes?: number;
  createdBy?: {
    _id: string;
    name: string;
    employeeId: string;
  };
  publishedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  _id: string;
  pollId: string;
  employeeId: string;
  selectedOptionId: string;
  submittedAt: string;
  updatedAt: string;
  active: boolean;
}

export interface ActivePollResponse {
  poll: Poll | null;
  polls: Poll[];
  serverTime: string;
  myVote: { voteId: string; selectedOptionId: string; submittedAt: string; updatedAt: string } | null;
  myVotes?: Record<string, { voteId: string; selectedOptionId: string; submittedAt: string; updatedAt: string }>;
}

export interface OptionResult {
  optionId: string;
  foodName: string;
  foodImage: string;
  description: string;
  voteCount: number;
  percentage: number;
}

export interface PollResults {
  pollId: string;
  title: string;
  status: PollStatus;
  startAt: string;
  endAt: string;
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
  options: OptionResult[];
}

export interface VoterItem {
  employeeId: string;
  employeeName: string;
  department?: string;
  selectedOptionId: string;
  selectedOptionName: string;
  submittedAt: string;
  updatedAt: string;
  ipAddress?: string;
  deviceIdentifier?: string;
  sessionId?: string;
}

export interface AuditLog {
  _id: string;
  actorUserId?: {
    _id: string;
    name: string;
    employeeId: string;
    role: string;
  };
  actorEmployeeId?: string;
  actorRole: string;
  action: string;
  pollId?: {
    _id: string;
    title: string;
    pollDate: string;
  };
  previousOptionName?: string;
  newOptionName?: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  deviceIdentifier: string;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityAlert {
  _id: string;
  severity: AlertSeverity;
  type: string;
  employeeId?: {
    _id: string;
    name: string;
    employeeId: string;
    department?: string;
  };
  employeeIdString?: string;
  pollId?: {
    _id: string;
    title: string;
  };
  description: string;
  details?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    name: string;
    employeeId: string;
  };
  createdAt: string;
}

export interface SystemSetting {
  key: string;
  defaultStartTime: string;
  defaultEndTime: string;
  timezone: string;
  allowVoteChangeDefault: boolean;
  defaultResultVisibility: ResultsVisibility;
  maxActiveSessionsPerEmployee: number;
  autoFlagSuspiciousVotes: boolean;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;
}

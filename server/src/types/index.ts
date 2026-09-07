export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type PollStatus = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

export type ResultsVisibility = 
  | 'PUBLIC_RESULTS' 
  | 'VOTER_NAMES_VISIBLE' 
  | 'RESULTS_ONLY' 
  | 'ADMIN_ONLY';

export type AuditAction =
  | 'VOTE_CREATED'
  | 'VOTE_UPDATED'
  | 'VOTE_WITHDRAWN'
  | 'VOTE_REJECTED'
  | 'POLL_CLOSED_VOTE_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_ACTIVATED'
  | 'SESSIONS_REVOKED'
  | 'POLL_CREATED'
  | 'POLL_UPDATED'
  | 'POLL_PUBLISHED'
  | 'POLL_CLOSED'
  | 'POLL_ARCHIVED'
  | 'FOOD_CREATED'
  | 'FOOD_UPDATED'
  | 'FOOD_DEACTIVATED';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ClientContext {
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  deviceIdentifier: string;
}

export interface AuthenticatedUserPayload {
  userId: string;
  employeeId: string;
  role: UserRole;
  sessionId: string;
}

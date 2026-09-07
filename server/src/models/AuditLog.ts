import mongoose, { Schema, Document, Types } from 'mongoose';
import { AuditAction, UserRole } from '../types/index.js';

export interface IAuditLog extends Document {
  actorUserId?: Types.ObjectId;
  actorEmployeeId?: string;
  actorRole: UserRole | 'SYSTEM';
  action: AuditAction;
  pollId?: Types.ObjectId;
  voteId?: Types.ObjectId;
  previousOptionId?: Types.ObjectId;
  previousOptionName?: string;
  newOptionId?: Types.ObjectId;
  newOptionName?: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  deviceIdentifier: string;
  timestamp: Date;
  reason?: string;
  metadata?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    actorEmployeeId: {
      type: String,
      trim: true,
      index: true
    },
    actorRole: {
      type: String,
      required: true,
      default: 'EMPLOYEE'
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      index: true
    },
    voteId: {
      type: Schema.Types.ObjectId,
      ref: 'Vote'
    },
    previousOptionId: {
      type: Schema.Types.ObjectId
    },
    previousOptionName: {
      type: String
    },
    newOptionId: {
      type: Schema.Types.ObjectId
    },
    newOptionName: {
      type: String
    },
    ipAddress: {
      type: String,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    sessionId: {
      type: String,
      default: 'unknown'
    },
    deviceIdentifier: {
      type: String,
      default: 'unknown'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    reason: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false
  }
);

AuditLogSchema.index({ pollId: 1, timestamp: -1 });
AuditLogSchema.index({ actorUserId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

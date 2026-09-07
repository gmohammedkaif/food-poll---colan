import mongoose, { Schema, Document, Types } from 'mongoose';
import { AlertSeverity } from '../types/index.js';

export interface ISecurityAlert extends Document {
  severity: AlertSeverity;
  type: string;
  employeeId?: Types.ObjectId;
  employeeIdString?: string;
  pollId?: Types.ObjectId;
  description: string;
  details?: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityAlertSchema = new Schema<ISecurityAlert>(
  {
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      index: true
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    employeeIdString: {
      type: String,
      index: true
    },
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll'
    },
    description: {
      type: String,
      required: true
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

SecurityAlertSchema.index({ resolved: 1, severity: 1, createdAt: -1 });

export const SecurityAlert = mongoose.model<ISecurityAlert>('SecurityAlert', SecurityAlertSchema);

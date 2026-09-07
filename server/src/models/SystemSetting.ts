import mongoose, { Schema, Document, Types } from 'mongoose';
import { ResultsVisibility } from '../types/index.js';

export interface ISystemSetting extends Document {
  key: string;
  defaultStartTime: string;
  defaultEndTime: string;
  timezone: string;
  allowVoteChangeDefault: boolean;
  defaultResultVisibility: ResultsVisibility;
  maxActiveSessionsPerEmployee: number;
  autoFlagSuspiciousVotes: boolean;
  logoUrl?: string;
  logoFileId?: string;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      default: 'GLOBAL_SETTINGS',
      unique: true,
      required: true
    },
    defaultStartTime: {
      type: String,
      default: '11:00'
    },
    defaultEndTime: {
      type: String,
      default: '12:30'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    allowVoteChangeDefault: {
      type: Boolean,
      default: true
    },
    defaultResultVisibility: {
      type: String,
      enum: ['PUBLIC_RESULTS', 'VOTER_NAMES_VISIBLE', 'RESULTS_ONLY', 'ADMIN_ONLY'],
      default: 'VOTER_NAMES_VISIBLE'
    },
    maxActiveSessionsPerEmployee: {
      type: Number,
      default: 3
    },
    autoFlagSuspiciousVotes: {
      type: Boolean,
      default: true
    },
    logoUrl: {
      type: String,
      default: ''
    },
    logoFileId: {
      type: String,
      default: ''
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);

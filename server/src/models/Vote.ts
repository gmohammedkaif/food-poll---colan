import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVote extends Document {
  pollId: Types.ObjectId;
  employeeId: Types.ObjectId;
  employeeIdSnapshot?: string;
  employeeNameSnapshot?: string;
  departmentSnapshot?: string;
  selectedOptionId: Types.ObjectId;
  submittedAt: Date;
  updatedAt: Date;
  active: boolean;
  currentSessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceIdentifier: string;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
      index: true
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    employeeIdSnapshot: {
      type: String,
      default: ''
    },
    employeeNameSnapshot: {
      type: String,
      default: ''
    },
    departmentSnapshot: {
      type: String,
      default: ''
    },
    selectedOptionId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    active: {
      type: Boolean,
      default: true,
      required: true
    },
    currentSessionId: {
      type: String,
      default: 'unknown'
    },
    ipAddress: {
      type: String,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    deviceIdentifier: {
      type: String,
      default: 'unknown'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring only 1 vote per employee per poll
VoteSchema.index({ pollId: 1, employeeId: 1 }, { unique: true });
VoteSchema.index({ pollId: 1, selectedOptionId: 1 });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);

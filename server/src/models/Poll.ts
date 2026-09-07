import mongoose, { Schema, Document, Types } from 'mongoose';
import { PollStatus, ResultsVisibility } from '../types/index.js';

export interface IPollOption {
  _id?: Types.ObjectId;
  foodId?: Types.ObjectId;
  foodNameSnapshot: string;
  foodImageSnapshot: string;
  descriptionSnapshot?: string;
  displayOrder: number;
}

export interface IPoll extends Document {
  title: string;
  description?: string;
  pollDate: Date;
  startAt: Date;
  endAt: Date;
  status: PollStatus;
  options: IPollOption[];
  allowVoteChange: boolean;
  resultsVisibility: ResultsVisibility;
  createdBy?: Types.ObjectId;
  publishedAt?: Date;
  closedAt?: Date;
  notificationSentAt?: Date;
  totalVotes?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>(
  {
    foodId: {
      type: Schema.Types.ObjectId,
      ref: 'Food'
    },
    foodNameSnapshot: {
      type: String,
      required: true,
      trim: true
    },
    foodImageSnapshot: {
      type: String,
      required: true,
      trim: true
    },
    descriptionSnapshot: {
      type: String,
      default: '',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const PollSchema = new Schema<IPoll>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Today's Lunch Poll"
    },
    description: {
      type: String,
      default: 'Choose your lunch preference for today',
      trim: true
    },
    pollDate: {
      type: Date,
      required: true,
      index: true
    },
    startAt: {
      type: Date,
      required: true,
      index: true
    },
    endAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'ARCHIVED'],
      default: 'DRAFT',
      required: true,
      index: true
    },
    options: {
      type: [PollOptionSchema],
      validate: [
        (opts: IPollOption[]) => opts.length >= 2,
        'Poll must contain at least 2 food options.'
      ]
    },
    allowVoteChange: {
      type: Boolean,
      default: true
    },
    resultsVisibility: {
      type: String,
      enum: ['PUBLIC_RESULTS', 'VOTER_NAMES_VISIBLE', 'RESULTS_ONLY', 'ADMIN_ONLY'],
      default: 'VOTER_NAMES_VISIBLE'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    publishedAt: {
      type: Date
    },
    closedAt: {
      type: Date
    },
    notificationSentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

PollSchema.index({ status: 1, startAt: 1, endAt: 1 });
PollSchema.index({ pollDate: 1, status: 1 });

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);

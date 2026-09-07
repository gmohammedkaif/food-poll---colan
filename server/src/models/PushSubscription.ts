import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPushSubscription extends Document {
  employeeId: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
        trim: true
      },
      auth: {
        type: String,
        required: true,
        trim: true
      }
    },
    userAgent: {
      type: String,
      default: ''
    },
    deviceType: {
      type: String,
      default: 'desktop'
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastUsedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying active subscriptions by employee
PushSubscriptionSchema.index({ employeeId: 1, isActive: 1 });

export const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  PushSubscriptionSchema
);

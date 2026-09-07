import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, UserStatus } from '../types/index.js';

export interface IUserSession {
  sessionId: string;
  deviceIdentifier: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  employeeId: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  activeSessions: IUserSession[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    sessionId: { type: String, required: true },
    deviceIdentifier: { type: String, default: 'unknown' },
    userAgent: { type: String, default: 'unknown' },
    ipAddress: { type: String, default: 'unknown' },
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'EMPLOYEE'],
      default: 'EMPLOYEE',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
      index: true
    },
    department: {
      type: String,
      trim: true
    },
    activeSessions: {
      type: [UserSessionSchema],
      default: []
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

UserSchema.index({ employeeId: 1, status: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

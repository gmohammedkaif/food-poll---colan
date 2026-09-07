import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFood extends Document {
  name: string;
  description: string;
  imageUrl: string;
  imageFileId?: string;
  category?: string;
  active: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema<IFood>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    imageFileId: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Lunch',
      trim: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

FoodSchema.index({ active: 1, name: 1 });

export const Food = mongoose.model<IFood>('Food', FoodSchema);

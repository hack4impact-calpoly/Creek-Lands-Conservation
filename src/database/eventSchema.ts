// Importing Mongoose
import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  registrationDeadline: Date;
  images: string[];
  registeredUsers: mongoose.Types.ObjectId[];
  waiverId: mongoose.Types.ObjectId[];
  fee: number;
  stripePaymentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventCreate {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity?: number;
  registrationDeadline: Date;
  images?: string[];
  fee?: number;
  stripePaymentId?: string;
}

export interface IEventUpdate {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  capacity?: number;
  registrationDeadline?: Date;
  images?: string[];
  fee?: number;
  stripePaymentId?: string | null;
}

// Defining the Event Schema
const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 0,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    images: [{ type: String, default: [] }],
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    waiverId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
    stripePaymentId: {
      type: String,
      default: null,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

// Exporting the Event model
export default mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);

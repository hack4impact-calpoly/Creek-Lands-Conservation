// Importing Mongoose
import mongoose, { Schema, Document } from "mongoose";

interface IEventRegisteredChild {
  parent: mongoose.Types.ObjectId; // references the User doc
  childId: mongoose.Types.ObjectId; // references the child's subdoc _id
  waiversSigned: {
    waiverId: mongoose.Types.ObjectId;
    signed: boolean;
  }[];
}

interface IEventRegisteredUser {
  user: mongoose.Types.ObjectId; // references the User doc
  waiversSigned: {
    waiverId: mongoose.Types.ObjectId;
    signed: boolean;
  }[];
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  registrationDeadline: Date;
  images: string[];
  registeredUsers: IEventRegisteredUser[];
  registeredChildren: IEventRegisteredChild[];
  eventWaiverTemplates: {
    waiverId: mongoose.Types.ObjectId;
    required: boolean;
  }[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  isDraft: boolean;
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
  eventWaiverTemplates: {
    waiverId: mongoose.Types.ObjectId;
    required: boolean;
  }[];
  fee?: number;
  stripePaymentId?: string;
  isDraft?: boolean;
  waiverTemplates?: { fileUrl: string; fileKey: string; fileName: string }[];
  paymentNote?: string;
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
  eventWaiverTemplates?: {
    waiverId: mongoose.Types.ObjectId;
    required: boolean;
  }[];
  fee?: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  waiverTemplates?: { fileUrl: string; fileKey: string; fileName: string }[];
  isDraft?: boolean;
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
      required: true,
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

    /**
     * Array of adult (main user) registrations
     */
    registeredUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // "User" to match userModel
        waiversSigned: [
          {
            waiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Waiver" },
            signed: { type: Boolean, default: false },
          },
        ],
      },
    ],

    /**
     * Array of children registrations:
     * - `parent` references the user's _id
     * - `childId` is the subdocument _id from the user's `children` array
     */
    registeredChildren: [
      {
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        childId: { type: mongoose.Schema.Types.ObjectId }, // No "ref" because it's an embedded subdoc
        waiversSigned: [
          {
            waiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Waiver" },
            signed: { type: Boolean, default: false },
          },
        ],
      },
    ],

    /**
     * Event-level waiver templates (for reference)
     */
    eventWaiverTemplates: [
      {
        waiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Waiver" },
        required: { type: Boolean, default: true },
      },
    ],

    /**
     * Fee and optional Stripe payment info
     */
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
    paymentNote: {
      type: String,
      trim: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({ startDate: 1 });
eventSchema.index({ "registeredUsers.user": 1 });
eventSchema.index({ "registeredChildren.childId": 1 });

/**
 * Export the Event model.
 * The model name here is "Event".
 * Event collections are created in the database with the name "events".
 */
export default mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);

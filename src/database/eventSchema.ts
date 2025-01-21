// Importing Mongoose
import mongoose, { Schema } from "mongoose";

// Defining the Event Schema
const eventSchema = new Schema(
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
    registeredUsers: [
      {
        type: Schema.Types.ObjectId, // Assuming that we will eventually have User schema
      },
    ],
    waiverId: {
      type: String, // Should probably be an objectID if we have a waiver schema eventually.
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
    stripePaymentId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Exporting the Event model
export default mongoose.models.Event || mongoose.model("Event", eventSchema);

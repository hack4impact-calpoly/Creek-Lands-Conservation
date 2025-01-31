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
export default mongoose.models.Event || mongoose.model("Event", eventSchema);

import mongoose, { Schema, Document } from "mongoose";

/**
 * Waiver interface for TypeScript
 */
export interface IWaiver extends Document {
  fileKey: string; // S3 Object Key (e.g., "waivers/completed/user123-waiver.pdf")
  fileName: string; // Original file name
  uploadedBy: mongoose.Types.ObjectId; // User who uploaded it (usually the parent user)
  belongsToUser: mongoose.Types.ObjectId; // The parent user's _id
  childSubdocId?: mongoose.Types.ObjectId; // The child’s subdocument _id (if any)
  isForChild: boolean; // Only true if childSubdocId is present
  uploadedAt: Date;
  type: "template" | "completed"; // Waiver type
  templateRef?: mongoose.Types.ObjectId; // Reference to the waiver template
  eventId?: mongoose.Types.ObjectId;
}

/**
 * Waiver schema
 */
const waiverSchema = new Schema<IWaiver>({
  fileKey: { type: String, required: true },
  fileName: { type: String, required: true },
  // The user who physically performed the upload
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // The parent user if the waiver belongs to a child or to the user themselves
  belongsToUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Null or undefined if the waiver is for the user themselves,
  // otherwise this is the _id of the child subdoc within that user
  childSubdocId: { type: mongoose.Schema.Types.ObjectId, required: false },

  // A simple boolean to indicate user vs. child waiver
  isForChild: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ["template", "completed"],
    required: true,
  },
  templateRef: { type: mongoose.Schema.Types.ObjectId, ref: "Waiver", required: false },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: false },
});

/**
 * Optional index to speed up queries by belongsTo + type
 */
waiverSchema.index({ belongsToUser: 1, type: 1 });

/**
 * Export the Waiver model
 * Waiver collections are created in the database with the name "waivers".
 */
export default mongoose.models.Waiver || mongoose.model<IWaiver>("Waiver", waiverSchema);

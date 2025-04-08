import mongoose, { Schema, Document } from "mongoose";
import { IWaiver } from "./waiverSchema";

/**
 * Child Interface (Subdocument)
 */
export interface IChild {
  /**
   * IMPORTANT: _id is automatically added by Mongoose subdocs
   * This is used to reference the subdocument in the event schema.
   */
  _id?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  birthday?: Date;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl?: string;
  imageKey?: string;
  /**
   * References to signed waiver IDs.
   * If you want to store the entire waiver doc, you can make this `IWaiver[]`.
   */
  waiversSigned: mongoose.Types.ObjectId[];
  /** Array of events this child is registered for */
  registeredEvents: mongoose.Types.ObjectId[];
}

/**
 * User Interface
 */
export interface IUser extends Document {
  clerkID: string;
  userRole: "user" | "admin" | "donator";
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  birthday?: Date | null;
  address?: {
    home?: string;
    city?: string;
    zipCode?: string;
  };
  phoneNumbers?: {
    cell?: string;
    work?: string;
  };
  imageUrl?: string;
  /** Internal S3 Object Identifier */
  imageKey?: string;
  /** Embedded subdocuments for children */
  children: IChild[];
  /** Top-level events this user is registered for (e.g., adult events) */
  registeredEvents: mongoose.Types.ObjectId[];
  /** Waivers the user (adult) has signed */
  waiversSigned: IWaiver[];
}

/**
 * Child subdocument schema for embedding inside User.
 * NOTE: We do not set { _id: false } so each child has its own subdocument _id.
 */
const childSchema = new Schema<IChild>(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    birthday: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say"] },
    imageUrl: { type: String, default: "" },
    // NEW FIELD to hold the S3 key, so we can delete the object if replaced:
    imageKey: { type: String, default: "" },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
  },
  { _id: true },
);

/**
 * Main User schema
 */
const userSchema = new Schema<IUser>(
  {
    clerkID: { type: String, required: true, unique: true },
    userRole: {
      type: String,
      enum: ["user", "admin", "donator"],
      default: "user",
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say", ""], default: "" },
    birthday: { type: Date, default: null },
    phoneNumbers: {
      cell: { type: String, trim: true, default: "" },
      work: { type: String, trim: true, default: "" },
    },
    address: {
      type: {
        home: {
          type: String,
          minlength: [5, "Address must be at least 5 characters long"],
          trim: true,
        },
        city: {
          type: String,
          match: [/^[a-zA-Z\s]+$/, "City must contain only letters and spaces"],
          trim: true,
        },
        zipCode: {
          type: String,
          validate: {
            validator: function (value: string) {
              if (!value) return true; // Allow empty value
              return /^\d{5}(-\d{4})?$/.test(value); // US Zip code validation
            },
            message: "Invalid zip code format",
          },
          message: "Invalid zip code format",
        },
        default: "",
      },
    },
    imageUrl: { type: String, default: "" },
    // NEW FIELD to hold the S3 key, so we can delete the object if replaced:
    imageKey: { type: String, default: "" },

    // Embedding children here
    children: { type: [childSchema], default: [] },

    // For adult events or single-user events
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

    // Waivers that the ADULT user has signed
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
  },
  {
    timestamps: true,
  },
);

/**
 * Pre-save hook to trim fields
 */
userSchema.pre("save", function (next) {
  this.firstName = this.firstName.trim();
  this.lastName = this.lastName.trim();
  this.email = this.email.trim();

  if (this.phoneNumbers?.cell) {
    this.phoneNumbers.cell = this.phoneNumbers.cell.trim();
  }
  if (this.phoneNumbers?.work) {
    this.phoneNumbers.work = this.phoneNumbers.work.trim();
  }

  if (this.address?.home) {
    this.address.home = this.address.home.trim();
  }
  if (this.address?.city) {
    this.address.city = this.address.city.trim();
  }
  if (this.address?.zipCode) {
    this.address.zipCode = this.address.zipCode.trim();
  }

  next();
});

/**
 * Export the User schema.
 * NOTE: The model name here is "User"; references in other schemas
 * should be `ref: "User"` to match.
 * User collections are created in the database with the name "users".
 */
export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);

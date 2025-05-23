import mongoose, { Schema, Document } from "mongoose";

export interface EmergencyContact {
  name: string;
  phone: string;
  work: string;
  relationship: string;
  canPickup: boolean;
}

export interface MedicalInfo {
  photoRelease: boolean;
  allergies: string;
  insurance: string;
  doctorName: string;
  doctorPhone: string;
  behaviorNotes: string;
  dietaryRestrictions: string;
  otherNotes: string;
}

export interface IChild {
  _id?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  birthday?: Date;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl?: string;
  imageKey?: string;
  waiversSigned: mongoose.Types.ObjectId[];
  registeredEvents: mongoose.Types.ObjectId[];
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
}

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
  imageKey?: string;
  children: IChild[];
  registeredEvents: mongoose.Types.ObjectId[];
  waiversSigned: mongoose.Types.ObjectId[];
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
}

// Reusable sub-schemas
const emergencyContactSchema = new Schema<EmergencyContact>(
  {
    name: String,
    phone: String,
    work: String,
    relationship: String,
    canPickup: Boolean,
  },
  { _id: false },
);

const medicalInfoSchema = new Schema<MedicalInfo>(
  {
    photoRelease: { type: Boolean, default: false },
    allergies: { type: String, default: "" },
    insurance: { type: String, default: "" },
    doctorName: { type: String, default: "" },
    doctorPhone: { type: String, default: "" },
    behaviorNotes: { type: String, default: "" },
    dietaryRestrictions: { type: String, default: "" },
    otherNotes: { type: String, default: "" },
  },
  { _id: false },
);

const childSchema = new Schema<IChild>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    birthday: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["Male", "Female", "Non-binary", "Prefer Not to Say"],
    },
    imageUrl: { type: String, default: "" },
    imageKey: { type: String, default: "" },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
    emergencyContacts: { type: [emergencyContactSchema], default: [] },
    medicalInfo: { type: medicalInfoSchema, default: {} },
  },
  { _id: true },
);

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
    gender: {
      type: String,
      enum: ["Male", "Female", "Non-binary", "Prefer Not to Say", ""],
      default: "",
    },
    birthday: { type: Date, default: null },
    phoneNumbers: {
      cell: { type: String, trim: true, default: "" },
      work: { type: String, trim: true, default: "" },
    },
    address: {
      home: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      zipCode: {
        type: String,
        validate: {
          validator: (val: string) => !val || /^\d{5}(-\d{4})?$/.test(val),
          message: "Invalid zip code format",
        },
        default: "",
      },
    },
    imageUrl: { type: String, default: "" },
    imageKey: { type: String, default: "" },
    children: { type: [childSchema], default: [] },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
    emergencyContacts: { type: [emergencyContactSchema], default: [] },
    medicalInfo: { type: medicalInfoSchema, default: {} },
  },
  { timestamps: true },
);

userSchema.pre("save", function (next) {
  this.firstName = this.firstName.trim();
  this.lastName = this.lastName.trim();
  this.email = this.email.trim();

  // Ensure phoneNumbers exists
  if (!this.phoneNumbers) this.phoneNumbers = {};
  this.phoneNumbers.cell = this.phoneNumbers.cell?.trim() || "";
  this.phoneNumbers.work = this.phoneNumbers.work?.trim() || "";

  // Ensure address exists
  if (!this.address) this.address = {};
  this.address.home = this.address.home?.trim() || "";
  this.address.city = this.address.city?.trim() || "";
  this.address.zipCode = this.address.zipCode?.trim() || "";

  this.children.forEach((child) => {
    child.firstName = child.firstName.trim();
    child.lastName = child.lastName.trim();
    if (child.imageUrl) child.imageUrl = child.imageUrl.trim();
    if (child.imageKey) child.imageKey = child.imageKey.trim();
  });

  next();
});

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);

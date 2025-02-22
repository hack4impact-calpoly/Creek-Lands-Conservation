import mongoose, { Schema, Document } from "mongoose";

export interface IChild {
  childID?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  birthday?: Date;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl?: string;
  waiversSigned: mongoose.Types.ObjectId[];
  registeredEvents: mongoose.Types.ObjectId[];
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
  children: IChild[];
  registeredEvents: mongoose.Types.ObjectId[];
  waiversSigned: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const childSchema = new Schema<IChild>(
  {
    childID: { type: mongoose.Schema.Types.ObjectId, auto: true },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    birthday: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say"], default: "" },
    imageUrl: { type: String, default: "" },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    clerkID: { type: String, required: true, unique: true },
    userRole: { type: String, enum: ["user", "admin", "donator"], default: "user" },
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
      home: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      zipCode: {
        type: String,
        validate: {
          validator: function (value: string) {
            return !value || /^\d{5}(-\d{4})?$/.test(value);
          },
          message: "Invalid zip code format",
        },
        default: "",
      },
    },
    imageUrl: { type: String, default: "" },
    children: { type: [childSchema], default: [] },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models["users"] || mongoose.model<IUser>("users", userSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IChild {
  name: string;
  birthday: Date;
  gender: string;
}

export interface IUser extends Document {
  clerkID: string;
  userRole: "user" | "admin" | "donator";
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  birthday: Date;
  children: [IChild];
  registeredEvents: mongoose.Types.ObjectId[];
  waiversSigned: mongoose.Types.ObjectId[];
}

const childSchema = new Schema<IChild>(
  {
    name: { type: String, required: true },
    birthday: { type: Date, required: true },
    gender: { type: String, requried: true, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say"] },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    clerkID: { type: String, required: true },
    userRole: { type: String, required: true, enum: ["user", "admin ", "donator"] },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say"] },
    birthday: { type: Date, required: true },
    children: { type: [childSchema], default: [] },
    registeredEvents: [],
    waiversSigned: [],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models["users"] || mongoose.model<IUser>("users", userSchema);

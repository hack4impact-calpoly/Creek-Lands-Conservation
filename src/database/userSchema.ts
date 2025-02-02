import mongoose, { Schema, Document } from "mongoose";

export interface IChild {
  childID: mongoose.Types.ObjectId; // Unique identifier for each child
  name: string;
  birthday: Date;
  gender: "Male" | "Female" | "Non-binary" | "Prefer Not to Say" | "";
  imageUrl: { type: String; default: "" };
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
  birthday: Date;
  imageUrl?: string;
  children: IChild[];
  registeredEvents: mongoose.Types.ObjectId[];
  waiversSigned: mongoose.Types.ObjectId[];
}

const childSchema = new Schema<IChild>(
  {
    childID: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String },
    birthday: { type: Date },
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
    userRole: { type: String, enum: ["user", "admin", "donator"] },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say", ""], default: "" },
    imageUrl: { type: String, default: "" },
    birthday: { type: Date },
    children: { type: [childSchema], default: [] },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models["users"] || mongoose.model<IUser>("users", userSchema);

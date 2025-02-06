import mongoose, { Schema, Document } from "mongoose";

export interface IChild {
  childID: mongoose.Types.ObjectId; // Unique identifier for each child
  firstName: string;
  lastName: string;
  birthday: Date;
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
  birthday?: Date;
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
}

const childSchema = new Schema<IChild>(
  {
    childID: { type: mongoose.Schema.Types.ObjectId, auto: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
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
    userRole: { type: String, enum: ["user", "admin", "donator"], default: "user" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Non-binary", "Prefer Not to Say", ""], default: "" },
    phoneNumbers: {
      type: {
        cell: { type: String, trim: true },
        work: { type: String, trim: true },
      },
      default: {},
    },
    address: {
      type: {
        home: { type: String, minlength: [5, "Address must be at least 5 characters long"], trim: true },
        city: { type: String, match: [/^[a-zA-Z\s]+$/, "City must contain only letters and spaces"], trim: true },
        zipCode: {
          type: String,
          validate: {
            validator: function (value: string) {
              if (!value) return true; // Allow empty value
              return /^\d{5}(-\d{4})?$/.test(value); // US Zip code validation
            },
            message: "Invalid zip code format",
          },
        },
      },
      default: {},
    },
    imageUrl: { type: String, default: "" },
    birthday: { type: Date, default: null },
    children: { type: [childSchema], default: [] },
    registeredEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    waiversSigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Waiver" }],
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", function (next) {
  this.firstName = this.firstName.trim();
  this.lastName = this.lastName.trim();
  this.email = this.email.trim();
  if (this.phoneNumbers?.cell) this.phoneNumbers.cell = this.phoneNumbers.cell.trim();
  if (this.phoneNumbers?.work) this.phoneNumbers.work = this.phoneNumbers.work.trim();
  if (this.address?.home) this.address.home = this.address.home.trim();
  if (this.address?.city) this.address.city = this.address.city.trim();
  if (this.address?.zipCode) this.address.zipCode = this.address.zipCode.trim();
  next();
});

export default mongoose.models["users"] || mongoose.model<IUser>("users", userSchema);

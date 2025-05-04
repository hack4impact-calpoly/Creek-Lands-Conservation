import mongoose, { Types } from "mongoose";

// API response type from getEvents
export interface APIEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string from server
  endDate: string; // ISO string from server
  location: string;
  capacity: number;
  registrationDeadline: string; // ISO string from server
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  isDraft: boolean;
  registeredUsers: RegisteredUserInfo[];
  registeredChildren: RegisteredChildInfo[];
  eventWaiverTemplates: EventWaiverTemplateInfo[];
  currentRegistrations: number;
}

// Limited version for non-admin users (if needed)
export interface LimitedEventInfo {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registrationDeadline?: string;
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  eventWaiverTemplates: {
    waiverId: string;
    required: boolean;
  }[];
  currentRegistrations: number;
  isDraft?: boolean;
}

export type EventFormData = {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  capacity: number;
  fee: number;
  description?: string;
  registrationDeadlineDate: string;
  registrationDeadlineTime: string;
};

// Types for raw Mongoose documents (returned by .lean())
export interface RawWaiverSigned {
  waiverId: mongoose.Types.ObjectId;
  signed: boolean;
}

export interface RawRegisteredUser {
  user: mongoose.Types.ObjectId;
  waiversSigned: RawWaiverSigned[];
}

export interface RawRegisteredChild {
  parent: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  waiversSigned: RawWaiverSigned[];
}

export interface RawEventWaiverTemplate {
  waiverId: mongoose.Types.ObjectId;
  required: boolean;
}

interface RawEventData {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location: string;
  capacity: number;
  registrationDeadline?: string;
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  isDraft: boolean;
  registeredUsers: { user: string; waiversSigned: { waiverId: string; signed: boolean }[] }[];
  registeredChildren: { parent: string; childId: string; waiversSigned: { waiverId: string; signed: boolean }[] }[];
  eventWaiverTemplates: { waiverId: string; required: boolean }[];
}

export interface RawEvent {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  registrationDeadline: Date;
  images: string[];
  fee: number;
  stripePaymentId?: string;
  paymentNote?: string;
  isDraft: boolean;
  registeredUsers: RawRegisteredUser[];
  registeredChildren: RawRegisteredChild[];
  eventWaiverTemplates: RawEventWaiverTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

// Types for formatted event data (returned by API or server actions)
export interface WaiverSignedInfo {
  waiverId: string;
  signed: boolean;
}

export interface RegisteredUserInfo {
  user: string;
  waiversSigned: WaiverSignedInfo[];
}

export interface RegisteredChildInfo {
  parent: string;
  childId: string;
  waiversSigned: WaiverSignedInfo[];
}

export interface EventWaiverTemplateInfo {
  waiverId: string;
  required: boolean;
}

export interface EventWaiverTemplateInput {
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  required?: boolean;
}

export interface EventPayload {
  title: string;
  description?: string;
  startDate: string; // ISO string from client
  endDate: string; // ISO string from client
  location: string;
  capacity?: number;
  registrationDeadline: string; // ISO string from client
  images?: string[];
  waiverTemplates?: EventWaiverTemplateInput[];
  fee?: number;
  stripePaymentId?: string;
  isDraft?: boolean;
  paymentNote?: string;
}

export interface FormattedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registrationDeadline: string;
  images: string[];
  fee: number;
  stripePaymentId?: string;
  paymentNote?: string;
  isDraft: boolean;
  eventWaiverTemplates: EventWaiverTemplateInfo[];
  registeredUsers: RegisteredUserInfo[];
  registeredChildren: RegisteredChildInfo[];
}

export interface EventInfo {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date | null; // Used in frontend
  endDateTime: Date | null; // Used in frontend
  startDate?: string; // Used in API responses (ISO string)
  endDate?: string; // Used in API responses (ISO string)
  location: string;
  capacity: number;
  registrationDeadline: Date | null; // Used in frontend
  registrationDeadlineDate?: string; // Used in API responses (ISO string)
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  isDraft: boolean;
  registeredUsers: RegisteredUserInfo[];
  registeredChildren: RegisteredChildInfo[];
  eventWaiverTemplates: EventWaiverTemplateInfo[];
  currentRegistrations: number;
}

import { Types } from "mongoose";

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

// /types/events.ts
export interface EventInfo {
  id: string;
  title: string;
  description?: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  location: string;
  capacity: number;
  registrationDeadline: Date | null;
  images: string[];
  fee: number;
  stripePaymentId?: string | null;
  paymentNote?: string;
  isDraft: boolean;

  // ——— CHANGED from string[] to object[]
  registeredUsers: {
    user: string;
    waiversSigned: { waiverId: string; signed: boolean }[];
  }[];

  registeredChildren: {
    parent: string;
    childId: string;
    waiversSigned: { waiverId: string; signed: boolean }[];
  }[];

  eventWaiverTemplates: {
    waiverId: string;
    required: boolean;
  }[];

  currentRegistrations: number;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  FormattedEvent,
  RawEvent,
  RawEventWaiverTemplate,
  RawRegisteredChild,
  RawRegisteredUser,
  RawWaiverSigned,
} from "@/types/events";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseDateTime = (date: string, time: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

export const validateEventDates = (startDate: Date, endDate: Date, registrationDeadline: Date): string | null => {
  if (startDate >= endDate) return "Event start must be before end time.";
  if (registrationDeadline > endDate) return "Registration deadline cannot be after event end.";
  return null;
};

/** Turn Mongoose doc into a nice JSON-friendly object */
export function formatEvents(doc: RawEvent): FormattedEvent {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate.toISOString(),
    location: doc.location,
    capacity: doc.capacity,
    registrationDeadline: doc.registrationDeadline?.toISOString() ?? "",
    images: doc.images,
    fee: doc.fee,
    stripePaymentId: doc.stripePaymentId ?? "",
    paymentNote: doc.paymentNote ?? "",
    isDraft: doc.isDraft,
    eventWaiverTemplates: doc.eventWaiverTemplates.map((w: RawEventWaiverTemplate) => ({
      waiverId: w.waiverId.toString(),
      required: w.required,
    })),
    registeredUsers: doc.registeredUsers.map((u: RawRegisteredUser) => ({
      user: u.user.toString(),
      waiversSigned: u.waiversSigned.map((s: RawWaiverSigned) => ({
        waiverId: s.waiverId.toString(),
        signed: s.signed,
      })),
    })),
    registeredChildren: doc.registeredChildren.map((c: RawRegisteredChild) => ({
      parent: c.parent.toString(),
      childId: c.childId.toString(),
      waiversSigned: c.waiversSigned.map((s: RawWaiverSigned) => ({
        waiverId: s.waiverId.toString(),
        signed: s.signed,
      })),
    })),
  };
}

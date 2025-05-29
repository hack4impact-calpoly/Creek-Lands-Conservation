import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  FormattedEvent,
  LimitedEventInfo,
  RawEvent,
  RawEventWaiverTemplate,
  RawRegisteredChild,
  RawRegisteredUser,
  RawUser,
  RawWaiverSigned,
  UserInfo,
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
    registeredUsers: doc.registeredUsers.map((u: RawRegisteredUser) => {
      const user = u.user as RawUser;
      return {
        user: {
          _id: user._id,
          clerkID: user.clerkID,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          gender: user.gender || "",
          birthday: user.birthday ? new Date(user.birthday).toISOString() : null,
          phoneNumbers: {
            cell: user.phoneNumbers?.cell || "",
            work: user.phoneNumbers?.work || "",
          },
          address: {
            home: user.address?.home || "",
            city: user.address?.city || "",
            zipCode: user.address?.zipCode || "",
          },
          children: user.children.map((child) => ({
            _id: child._id.toString(), // Convert ObjectId to string
            firstName: child.firstName,
            lastName: child.lastName,
            birthday: child.birthday ? new Date(child.birthday).toISOString() : null,
            gender: child.gender || "",
            emergencyContacts: child.emergencyContacts || [],
            medicalInfo: child.medicalInfo || {
              allergies: "",
              dietaryRestrictions: "",
              photoRelease: false,
              insurance: "",
              doctorName: "",
              doctorPhone: "",
              behaviorNotes: "",
            },
          })),
          medicalInfo: user.medicalInfo || {
            photoRelease: false,
            allergies: "",
            insurance: "",
            doctorName: "",
            doctorPhone: "",
            behaviorNotes: "",
            dietaryRestrictions: "",
          },
          emergencyContacts: user.emergencyContacts || [],
        },
        waiversSigned: u.waiversSigned.map((s: RawWaiverSigned) => ({
          waiverId: s.waiverId.toString(),
          signed: s.signed,
        })),
      };
    }),
    registeredChildren: doc.registeredChildren.map((c: RawRegisteredChild) => {
      const parent = c.parent as RawUser;
      return {
        parent: {
          _id: parent._id,
          clerkID: parent.clerkID,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          gender: parent.gender || "",
          birthday: parent.birthday ? new Date(parent.birthday).toISOString() : null,
          phoneNumbers: {
            cell: parent.phoneNumbers?.cell || "",
            work: parent.phoneNumbers?.work || "",
          },
          address: {
            home: parent.address?.home || "",
            city: parent.address?.city || "",
            zipCode: parent.address?.zipCode || "",
          },
          children: parent.children.map((child) => ({
            _id: child._id.toString(), // Convert ObjectId to string
            firstName: child.firstName,
            lastName: child.lastName,
            birthday: child.birthday ? new Date(child.birthday).toISOString() : null,
            gender: child.gender || "",
            emergencyContacts: child.emergencyContacts || [],
            medicalInfo: child.medicalInfo || {
              allergies: "",
              dietaryRestrictions: "",
              photoRelease: false,
              insurance: "",
              doctorName: "",
              doctorPhone: "",
              behaviorNotes: "",
            },
          })),
          medicalInfo: parent.medicalInfo || {
            photoRelease: false,
            allergies: "",
            insurance: "",
            doctorName: "",
            doctorPhone: "",
            behaviorNotes: "",
            dietaryRestrictions: "",
          },
          emergencyContacts: parent.emergencyContacts || [],
        },
        childId: c.childId.toString(),
        waiversSigned: c.waiversSigned.map((s: RawWaiverSigned) => ({
          waiverId: s.waiverId.toString(),
          signed: s.signed,
        })),
      };
    }),
  };
}

export function formatLimitedEvents(doc: RawEvent): LimitedEventInfo {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate.toISOString(),
    location: doc.location,
    capacity: doc.capacity,
    registrationDeadline: doc.registrationDeadline?.toISOString(),
    images: doc.images,
    fee: doc.fee,
    stripePaymentId: doc.stripePaymentId ?? null,
    paymentNote: doc.paymentNote ?? "",
    eventWaiverTemplates: doc.eventWaiverTemplates.map((w: RawEventWaiverTemplate) => ({
      waiverId: w.waiverId.toString(),
      required: w.required,
    })),
    currentRegistrations: doc.registeredUsers.length + doc.registeredChildren.length,
    isDraft: doc.isDraft,
  };
}

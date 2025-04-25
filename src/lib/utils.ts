import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EventInfo } from "@/types/events";

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

export const formatEvents = (data: any[]): EventInfo[] =>
  data.map((evt) => ({
    id: evt.id,
    title: evt.title,
    description: evt.description || "",
    startDateTime: evt.startDate ? new Date(evt.startDate) : null,
    endDateTime: evt.endDate ? new Date(evt.endDate) : null,
    location: evt.location,
    images: Array.isArray(evt.images) ? evt.images : [],
    registrationDeadline: evt.registrationDeadline ? new Date(evt.registrationDeadline) : null,
    capacity: evt.capacity,
    fee: evt.fee,
    stripePaymentId: evt.stripePaymentId ?? null,
    paymentNote: evt.paymentNote ?? "",
    isDraft: evt.isDraft,
    // these two must match your objects, not be string[]
    registeredUsers: Array.isArray(evt.registeredUsers)
      ? evt.registeredUsers.map((u: any) => ({
          user: u.user,
          waiversSigned: u.waiversSigned.map((w: any) => ({
            waiverId: w.waiverId,
            signed: w.signed,
          })),
        }))
      : [],
    registeredChildren: Array.isArray(evt.registeredChildren)
      ? evt.registeredChildren.map((c: any) => ({
          parent: c.parent,
          childId: c.childId,
          waiversSigned: c.waiversSigned.map((w: any) => ({
            waiverId: w.waiverId,
            signed: w.signed,
          })),
        }))
      : [],
    eventWaiverTemplates: Array.isArray(evt.eventWaiverTemplates)
      ? evt.eventWaiverTemplates.map((t: any) => ({
          waiverId: t.waiverId,
          required: t.required,
        }))
      : [],
    currentRegistrations: (evt.registeredUsers?.length || 0) + (evt.registeredChildren?.length || 0),
  }));

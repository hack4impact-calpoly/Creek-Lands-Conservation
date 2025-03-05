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
  data.map((event) => ({
    id: event._id.toString(),
    title: event.title || "Untitled Event",
    startDateTime: event.startDate ? new Date(event.startDate) : null,
    endDateTime: event.endDate ? new Date(event.endDate) : null,
    location: event.location || "Location not available",
    description: event.description || "No description provided",
    images: Array.isArray(event.images) ? event.images : [],
    registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : null,
    capacity: event.capacity || 0,
    registeredUsers: event.registeredUsers?.map((u: any) => u.toString()) || [],
  }));

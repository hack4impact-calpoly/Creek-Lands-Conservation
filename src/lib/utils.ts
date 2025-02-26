import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

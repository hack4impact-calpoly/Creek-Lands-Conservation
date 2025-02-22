import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toLocalDateString = (date: Date): string => {
  const localDate = new Date(date);
  return [
    localDate.getFullYear(),
    String(localDate.getMonth() + 1).padStart(2, "0"),
    String(localDate.getDate()).padStart(2, "0"),
  ].join("-");
};

export const toLocalTimeString = (date: Date): string => {
  const localDate = new Date(date);
  return [String(localDate.getHours()).padStart(2, "0"), String(localDate.getMinutes()).padStart(2, "0")].join(":");
};

export const parseDateTime = (date: string, time: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

export const validateEventDates = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  registrationDeadlineDate: string,
  registrationDeadlineTime: string,
): string | null => {
  const startDateTime = parseDateTime(startDate, startTime);
  const endDateTime = parseDateTime(endDate, endTime);
  const registrationDeadline = parseDateTime(registrationDeadlineDate, registrationDeadlineTime);

  if (startDateTime >= endDateTime) return "Event start must be before end time.";
  if (registrationDeadline > endDateTime) return "Registration deadline cannot be after event end.";

  return null;
};

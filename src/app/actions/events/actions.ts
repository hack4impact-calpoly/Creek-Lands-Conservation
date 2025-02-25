"use server";

import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import { Types } from "mongoose";

interface LeanEvent {
  _id: Types.ObjectId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  registrationDeadline?: Date;
  images?: string[];
  registeredUsers?: string[];
  fee?: number;
}

export async function getEvents() {
  try {
    await connectDB();
    const events = await Event.find().sort({ startDate: 1 }).lean<LeanEvent[]>();
    console.log("Raw events from DB:", events);

    const formattedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      startDate: event.startDate ? new Date(event.startDate).toISOString() : null,
      endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
      location: event.location,
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString() : null,
      images: event.images || [], // Simply pass through the image URLs
      currentRegistrations: event.registeredUsers?.length || 0,
      fee: event.fee,
    }));

    console.log("Final formatted events:", formattedEvents);
    return formattedEvents;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Failed to fetch events");
  }
}

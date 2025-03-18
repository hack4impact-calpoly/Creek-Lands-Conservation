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
  registeredUsers?: Types.ObjectId[];
  registeredChildren?: Types.ObjectId[];
  fee?: number;
}

export async function getEvents() {
  try {
    await connectDB();

    const events = await Event.find().sort({ startDate: 1 }).lean<LeanEvent[]>();

    const formattedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      startDate: event.startDate ? new Date(event.startDate).toISOString() : null,
      endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
      location: event.location,
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString() : null,
      images: event.images || [],
      currentRegistrations: event.registeredUsers?.length || 0,
      registeredUsers: event.registeredUsers ? event.registeredUsers.map((id) => id.toString()) : [],
      registeredChildren: event.registeredChildren ? event.registeredChildren.map((id) => id.toString()) : [],
      fee: event.fee,
    }));

    return formattedEvents;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Failed to fetch events");
  }
}

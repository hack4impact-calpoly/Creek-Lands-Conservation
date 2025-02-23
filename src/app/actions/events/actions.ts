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
    return events.map((event) => {
      return {
        _id: event._id.toString(),
        title: event.title,
        description: event.description,
        startDate: event.startDate ? new Date(event.startDate).toLocaleString() : null,
        endDate: event.endDate ? new Date(event.endDate).toLocaleString() : null,
        location: event.location,
        capacity: event.capacity,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleString() : null,
        images: event.images || [],
        currentRegistrations: event.registeredUsers?.length || 0,
        registeredUsers: event.registeredUsers ? event.registeredUsers.map((user: any) => user.toString()) : [],
        fee: event.fee,
      };
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Failed to fetch events");
  }
}

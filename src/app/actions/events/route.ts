"use server";

import connectDB from "@/database/db";
import Event from "@/database/eventSchema";

export async function getEvents() {
  try {
    await connectDB();
    const events = await Event.find().sort({ startDate: 1 }).lean();

    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Failed to fetch events");
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import { authenticateAdmin } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

// PUT: Update an Event
export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();

  const { eventID } = params;
  // Checking if the ID is valid
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const { userId } = await auth(); // ✅ Get the authenticated user ID
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const updatedData = await req.json();

    // Check if user is trying to register for event
    if (updatedData.registerForEvent) {
      const event = await Event.findById(eventID);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      // Check if user already registered for the event
      if (event.registeredUsers.includes(userId)) {
        return NextResponse.json({ error: "User already registered for this event" }, { status: 400 });
      }

      // Check if the registration deadline passed
      if (new Date() > event.registrationDeadline) {
        return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
      }

      // Check if event is full
      if (event.capacity > 0 && event.registeredUsers.length >= event.capacity) {
        return NextResponse.json({ error: "Event is at full capacity." }, { status: 400 });
      }

      event.registeredUsers.push(userId);
      await event.save();

      return NextResponse.json({ message: "Successfully registered for the event.", event }, { status: 200 });
    }

    // If not registering, check if the user is an admin (to update event details)
    const authError = await authenticateAdmin();
    if (authError !== true) return authError;

    // Checks if ID exists before attempting to update
    const updatedEvent = await Event.findByIdAndUpdate(eventID, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    // Check the type of error to make typescript happy
    return NextResponse.json(
      { error: "Error updating event", details: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  }
}

// DELETE: Remove an Event
export async function DELETE(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();

  const authError = await authenticateAdmin();
  if (authError !== true) return authError;

  const { eventID } = params;
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const deletedEvent = await Event.findByIdAndDelete(eventID);

    if (!deletedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting event", details: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  }
}

// Fetch a single event by ID
export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();

  const { eventID } = params;
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const event = await Event.findById(eventID);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching event", details: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
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
      console.log(`Event not found: ${eventID}`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventID);

    // Update top-level registeredEvents
    const userUpdate = await User.updateMany(
      { registeredEvents: eventObjectId },
      { $pull: { registeredEvents: eventObjectId } },
    );
    console.log(`User registeredEvents update: ${JSON.stringify(userUpdate)}`);

    // Update children's registeredEvents
    const childUpdate = await User.updateMany(
      { "children.registeredEvents": eventObjectId },
      { $pull: { "children.$[].registeredEvents": eventObjectId } },
    );
    console.log(`Children registeredEvents update: ${JSON.stringify(childUpdate)}`);

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error during event deletion:", error);
    return NextResponse.json(
      { error: "Error deleting event", details: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  }
}

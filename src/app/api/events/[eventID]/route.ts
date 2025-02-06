import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";

// PUT: Update an Event
export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();

  const { eventID } = params;
  // Checking if the ID is valid
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const updatedData = await req.json();
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

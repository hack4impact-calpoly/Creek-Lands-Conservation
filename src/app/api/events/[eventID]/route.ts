// src/app/api/events/[eventID]/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import User from "@/database/userSchema"; // Import User schema for updates
import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { auth, getAuth } from "@clerk/nextjs/server";
import { EventPayload, EventWaiverTemplateInput, RawEvent } from "@/types/events";
import { formatEvents } from "@/lib/utils";

// GET: Fetch a single event by ID
export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  // Validate the event ID
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const event = (await Event.findById(eventID).lean()) as RawEvent | null;
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(formatEvents(event), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching event", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE: Remove an Event
export async function DELETE(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();

  // Authenticate the user as an admin
  const authError = await authenticateAdmin();
  if (authError !== true) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventID } = params;
  // Validate the event ID
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }
  const session = await mongoose.startSession();
  const eventObjectId = new mongoose.Types.ObjectId(eventID);

  try {
    session.startTransaction();

    // Delete the event
    const deletedEvent = (await Event.findByIdAndDelete(eventID).lean()) as RawEvent | null;
    if (!deletedEvent) {
      console.log(`Event not found: ${eventID}`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete waivers associated with this event
    await Waiver.deleteMany({ eventId: new mongoose.Types.ObjectId(eventID) });

    // Remove event from users' registeredEvents
    await User.updateMany(
      { registeredEvents: eventObjectId },
      { $pull: { registeredEvents: eventObjectId } },
      { session },
    );

    // Remove event from children registeredEvents
    await User.updateMany(
      { "children.registeredEvents": eventObjectId },
      { $pull: { "children.$[].registeredEvents": eventObjectId } },
      { session },
    );
    await session.commitTransaction();

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error during event deletion:", error);
    return NextResponse.json(
      { error: "Error deleting event", details: error instanceof Error ? error.message : error },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}

// PUT: Update an event
export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  // make sure caller is an admin
  const authError = await authenticateAdmin();
  if (authError !== true) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let updates: Partial<EventPayload>;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const updated = (await Event.findByIdAndUpdate(eventID, updates, {
    new: true,
    runValidators: true,
  }).lean()) as RawEvent | null;

  if (!updated) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(formatEvents(updated), { status: 200 });
}

// PATCH: Update event images and waivers
export async function PATCH(req: NextRequest, { params }: { params: { eventID: string } }) {
  const { userId } = getAuth(req);
  if (!userId || !(await authenticateAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { eventID } = params;
  const { images, waiverTemplates } = await req.json();

  try {
    // Create waiver documents if waiverTemplates are provided
    let eventWaiverTemplates: { waiverId: mongoose.Types.ObjectId; required: boolean }[] = [];
    if (Array.isArray(waiverTemplates)) {
      const mongoUser = await User.findOne({ clerkID: userId });
      if (!mongoUser) {
        return NextResponse.json({ error: "User record not found" }, { status: 404 });
      }

      eventWaiverTemplates = await Promise.all(
        waiverTemplates.map(async (pdf: EventWaiverTemplateInput) => {
          const doc = await Waiver.create({
            fileKey: pdf.fileKey,
            fileName: pdf.fileName || "template.pdf",
            type: "template",
            uploadedBy: mongoUser._id,
            belongsToUser: mongoUser._id,
            eventId: new mongoose.Types.ObjectId(eventID),
          });
          return {
            waiverId: doc._id,
            required: true, // Adjust as needed
          };
        }),
      );
    }

    const event = (await Event.findByIdAndUpdate(
      eventID,
      { $set: { images, eventWaiverTemplates } },
      { new: true },
    ).lean()) as RawEvent | null;

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(formatEvents(event));
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

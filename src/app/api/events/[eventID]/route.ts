// src/app/api/events/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import User from "@/database/userSchema"; // Import User schema for updates
import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";

interface EventWaiverTemplateInput {
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  required?: boolean;
}

interface EventPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity?: number;
  registrationDeadline: string;
  images?: string[];
  waiverTemplates?: EventWaiverTemplateInput[];
  fee?: number;
  stripePaymentId?: string;
  isDraft?: boolean;
  paymentNote?: string;
}

function formatEvent(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate.toISOString(),
    location: doc.location,
    capacity: doc.capacity,
    registrationDeadline: doc.registrationDeadline.toISOString(),
    images: doc.images,
    fee: doc.fee,
    stripePaymentId: doc.stripePaymentId,
    paymentNote: doc.paymentNote,
    isDraft: doc.isDraft,
    eventWaiverTemplates: doc.eventWaiverTemplates.map((w: any) => ({
      waiverId: w.waiverId.toString(),
      required: w.required,
    })),
    registeredUsers: doc.registeredUsers.map((u: any) => ({
      user: u.user.toString(),
      waiversSigned: u.waiversSigned.map((s: any) => ({
        waiverId: s.waiverId.toString(),
        signed: s.signed,
      })),
    })),
    registeredChildren: doc.registeredChildren.map((c: any) => ({
      parent: c.parent.toString(),
      childId: c.childId.toString(),
      waiversSigned: c.waiversSigned.map((s: any) => ({
        waiverId: s.waiverId.toString(),
        signed: s.signed,
      })),
    })),
  };
}

/** POST: Create a new event */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const mongoUser = await User.findOne({ clerkID: userId });
  if (!mongoUser) {
    return NextResponse.json({ error: "User record not found" }, { status: 404 });
  }
  const authError = await authenticateAdmin();
  if (authError !== true) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: EventPayload = await request.json();
  for (const f of ["title", "startDate", "endDate"] as const) {
    if (!body[f]) {
      return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 });
    }
  }

  // Build waiver templates array
  let eventWaiverTemplates: { waiverId: mongoose.Types.ObjectId; required: boolean }[] = [];
  if (Array.isArray(body.waiverTemplates)) {
    const created = await Promise.all(
      body.waiverTemplates.map(async (pdf) => {
        const doc = await Waiver.create({
          fileKey: pdf.fileKey || pdf.fileUrl,
          fileName: pdf.fileName || "template.pdf",
          type: "template",
          uploadedBy: mongoUser._id,
          belongsToUser: mongoUser._id,
        });
        return {
          waiverId: doc._id,
          required: pdf.required ?? true,
        };
      }),
    );
    eventWaiverTemplates = created;
  }

  const toCreate = {
    title: body.title,
    description: body.description,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    location: body.location,
    capacity: body.capacity ?? 0,
    registrationDeadline: new Date(body.registrationDeadline),
    images: body.images ?? [],
    fee: body.fee ?? 0,
    stripePaymentId: body.stripePaymentId ?? null,
    paymentNote: body.paymentNote ?? "",
    isDraft: body.isDraft ?? false,
    registeredUsers: [],
    registeredChildren: [],
    eventWaiverTemplates,
  };

  const newEvent = await Event.create(toCreate);
  return NextResponse.json(formatEvent(newEvent), { status: 201 });
}
// GET: Fetch a single event by ID
export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  // Validate the event ID
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

  try {
    // Delete the event
    const deletedEvent = await Event.findByIdAndDelete(eventID);
    if (!deletedEvent) {
      console.log(`Event not found: ${eventID}`);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventID);

    // Update top-level registeredEvents in User schema
    const userUpdate = await User.updateMany(
      { registeredEvents: eventObjectId },
      { $pull: { registeredEvents: eventObjectId } },
    );
    console.log(`User registeredEvents update: ${JSON.stringify(userUpdate)}`);

    // Update children's registeredEvents in User schema
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

export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;
  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  // make sure caller is an admin
  const authError = await authenticateAdmin();
  if (authError !== true) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let updates;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const updated = await Event.findByIdAndUpdate(eventID, updates, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // return the updated event so res.json() succeeds
  return NextResponse.json(updated, { status: 200 });
}

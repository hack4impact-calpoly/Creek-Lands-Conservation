// src/app/api/events/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import User from "@/database/userSchema";
import { formatLimitedEvents } from "@/lib/utils";
import { EventPayload } from "@/types/events";

// src/app/api/events/route.ts
// This route handles creating new events
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
  console.log("Received Request Body:", body);

  for (const f of ["title", "startDate", "endDate"] as const) {
    if (!body[f]) {
      return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 });
    }
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
    isDraft: body.isDraft ?? false,
    registeredUsers: [],
    registeredChildren: [],
    eventWaiverTemplates: [],
  };

  const newEvent = await Event.create(toCreate);
  return NextResponse.json(formatLimitedEvents(newEvent), { status: 201 });
}

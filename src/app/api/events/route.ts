// src/app/api/events/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import User from "@/database/userSchema";
import { formatEvents } from "@/lib/utils";
import { EventPayload } from "@/types/events";

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

  let eventWaiverTemplates: { waiverId: mongoose.Types.ObjectId; required: boolean }[] = [];
  if (Array.isArray(body.waiverTemplates)) {
    const created = await Promise.all(
      body.waiverTemplates.map(async (pdf) => {
        const w = await Waiver.create({
          fileKey: pdf.fileKey || pdf.fileUrl,
          fileName: pdf.fileName || "template.pdf",
          type: "template",
          uploadedBy: mongoUser._id,
          belongsToUser: mongoUser._id,
        });
        return {
          waiverId: w._id,
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
  return NextResponse.json(formatEvents(newEvent), { status: 201 });
}

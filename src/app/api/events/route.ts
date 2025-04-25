// src/app/api/events/route.ts
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

interface EventWaiverTemplateInput {
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  required?: boolean;
}

interface EventPayload {
  title: string;
  description?: string;
  startDate: string; // ISO string from client
  endDate: string; // ISO string from client
  location: string;
  capacity?: number;
  registrationDeadline: string; // ISO string from client
  images?: string[];
  waiverTemplates?: EventWaiverTemplateInput[];
  fee?: number;
  stripePaymentId?: string;
  isDraft?: boolean;
  paymentNote?: string;
}

/** Turn your Mongoose doc into a nice JSON-friendly object */
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
    // etc…
  };
}

export async function POST(request: Request) {
  const authError = await authenticateAdmin();
  if (authError !== true) return authError;

  const body: EventPayload = await request.json();
  console.log("Received Request Body:", body);

  for (const f of ["title", "startDate", "endDate"] as const) {
    if (!body[f]) {
      return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 });
    }
  }

  await connectDB();

  let eventWaiverTemplates: { waiverId: mongoose.Types.ObjectId; required: boolean }[] = [];
  if (Array.isArray(body.waiverTemplates)) {
    const created = await Promise.all(
      body.waiverTemplates.map(async (pdf) => {
        const w = await Waiver.create({
          fileKey: pdf.fileKey || pdf.fileUrl,
          fileName: pdf.fileName || "template.pdf",
          type: "template",
          uploadedBy: new mongoose.Types.ObjectId(),
          belongsToUser: new mongoose.Types.ObjectId(),
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

  console.log("toCreate Object:", toCreate); // Debug log
  const newEvent = await Event.create(toCreate);
  return NextResponse.json(formatEvent(newEvent), { status: 201 });
}

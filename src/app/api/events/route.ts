import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import Waiver from "@/database/waiverSchema";
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

interface EventWaiverTemplate {
  waiverId: mongoose.Types.ObjectId;
  required: boolean;
}

export async function POST(request: Request) {
  try {
    const authError = await authenticateAdmin();
    if (authError !== true) return authError;

    const body = await request.json();

    // Validate required fields
    const requiredFields = ["title", "startDate", "endDate"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    await connectDB();

    // 1) Create "template" Waivers for each PDF
    const { waiverTemplates } = body;
    let eventWaiverTemplates: EventWaiverTemplate[] = [];
    if (Array.isArray(waiverTemplates) && waiverTemplates.length > 0) {
      const createdWaivers = [];
      for (const pdf of waiverTemplates) {
        // For instance, if you want to store:
        // fileKey, fileName, type=template, etc.
        const waiverDoc = await Waiver.create({
          fileKey: pdf.fileKey || pdf.fileUrl,
          fileName: pdf.fileName || "template.pdf",
          type: "template",
          // Possibly store a real user ID if you have it:
          uploadedBy: new mongoose.Types.ObjectId("67c500994a070fbb8c9a98e4"),
          belongsToUser: new mongoose.Types.ObjectId("67c500994a070fbb8c9a98e4"),
        });
        createdWaivers.push(waiverDoc);
      }

      // 2) Build `eventWaiverTemplates` referencing each new waiver _id
      eventWaiverTemplates = createdWaivers.map((doc) => ({
        waiverId: doc._id,
        required: true, // or read from `pdf` if you want to dynamically set required?
      }));
    }

    const newEvent = await Event.create({
      ...body,
      registeredUsers: [],
      eventWaiverTemplates,
      registeredChildren: [],
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

import connectDB from "@/database/db";
import Event, { IEvent } from "@/database/eventSchema";
import Waiver, { IWaiver } from "@/database/waiverSchema";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const waivers = await Waiver.find({ eventId: eventID, type: "template" });
    return NextResponse.json({ waivers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

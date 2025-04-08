import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/auth";

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

    const newEvent = await Event.create({
      ...body,
      registeredUsers: [],
      registeredChildren: [],
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";

export async function GET(request: Request) {
  try {
    await connectDB();

    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // Fetch events where the user is registered
    const registeredEvents = await Event.find({ registeredUsers: userId });

    return NextResponse.json(registeredEvents, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch registered events:", error);
    return NextResponse.json({ error: "Failed to fetch registered events" }, { status: 500 });
  }
}

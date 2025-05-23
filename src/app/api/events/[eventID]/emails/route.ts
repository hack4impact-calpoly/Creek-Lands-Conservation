import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User from "@/database/userSchema";
import { authenticateAdmin } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const authError = await authenticateAdmin();
  const user = await User.findOne({ clerkID: userId });
  if (!user || !authError) {
    return NextResponse.json({ error: "Forbidden. You do not have access to this resource." + user }, { status: 403 });
  }

  const event = await Event.findById(eventID).populate("registeredUsers.user").populate("registeredChildren.childId");
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const emailsSet = new Set<string>();

  // Add emails of registered adult users
  event.registeredUsers.forEach((ru: { user: { email: string } }) => {
    if (ru.user && ru.user.email) {
      emailsSet.add(ru.user.email);
    }
  });

  // Add parent emails for registered children
  for (const rc of event.registeredChildren) {
    const child = await User.findById(rc.childId).select("email");
    if (child && child.email) {
      emailsSet.add(child.email);
    }
  }

  const emails = Array.from(emailsSet);

  return NextResponse.json({ emails }, { status: 200 });
}

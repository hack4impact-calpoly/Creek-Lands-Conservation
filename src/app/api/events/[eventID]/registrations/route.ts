import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import Event from "@/database/eventSchema";
import User, { IUser } from "@/database/userSchema";
import mongoose from "mongoose";

export async function PUT(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await User.findOne({ clerkID: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mongoUserId = user._id.toString();
    const { attendees } = await req.json();

    if (
      !attendees ||
      !Array.isArray(attendees) ||
      attendees.length === 0 ||
      !attendees.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return NextResponse.json({ error: "Invalid attendees format." }, { status: 400 });
    }

    // Ensure only family can be registered
    const validAttendees = [mongoUserId.toString(), ...user.children.map((child: any) => child._id.toString())];

    const isValidRegistration = attendees.every((id) => validAttendees.includes(id));
    if (!isValidRegistration) {
      return NextResponse.json({ error: "You can only register yourself or your children." }, { status: 403 });
    }

    const event = await Event.findById(eventID);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const requiredCapacity = event.registeredUsers.length + event.registeredChildren.length + attendees.length;
    if (requiredCapacity > event.capacity) {
      return NextResponse.json({ error: "The event is too full." }, { status: 400 });
    }

    if (new Date() > event.registrationDeadline) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
    }

    const newRegisteredUsers: mongoose.Types.ObjectId[] = [];
    const newRegisteredChildren: mongoose.Types.ObjectId[] = [];

    attendees.forEach((id) => {
      // check if the atendee is the user or a child
      if (id === mongoUserId.toString() && !event.registeredUsers.includes(user._id)) {
        event.registeredUsers.push(user._id);
        user.registeredEvents.push(eventID);
        newRegisteredUsers.push(user._id);
      } else {
        const child = user.children.find((c: any) => c._id.toString() === id);
        if (child && !event.registeredChildren.includes(child._id)) {
          event.registeredChildren.push(child._id);
          child.registeredEvents.push(eventID);
          newRegisteredChildren.push(child._id);
        }
      }
    });

    if (newRegisteredChildren.length === 0 && newRegisteredUsers.length === 0) {
      return NextResponse.json({ error: "Selected attendees are already registered." }, { status: 400 });
    }

    await event.save();
    await user.save();

    return NextResponse.json(
      {
        message: "Successfully registered",
        registeredUsers: newRegisteredUsers,
        registeredChildren: newRegisteredChildren,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: "Error processing registration" }, { status: 500 });
  }
}

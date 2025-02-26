import { NextRequest, NextResponse } from "next/server";
import User from "@/database/userSchema";
import connectDB from "@/database/db";

// GET /api/users/[clerkID]
export async function GET(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();

    const user = await User.findOne({ clerkID: params.clerkID });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/users/[clerkID]
export async function PUT(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();
    const data = await req.json();

    const { firstName, lastName, email, gender, birthday, phoneNumbers, address, children } = data;

    const updatedUser = await User.findOneAndUpdate(
      { clerkID: params.clerkID },
      {
        firstName,
        lastName,
        email,
        gender,
        birthday,
        phoneNumbers,
        address,
        children,
        // We do NOT update imageUrl, registeredEvents, or waiversSigned
        // since they aren't included in the payload
      },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

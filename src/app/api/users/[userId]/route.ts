import { NextRequest, NextResponse } from "next/server";
import User from "@/database/userSchema";
import connectDB from "@/database/db";

// GET: uses user clerkID to fetch user info from mongodb
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

// PUT: update all user data (except Mongo _id) with the request body
export async function PUT(req: NextRequest, { params }: { params: { clerkID: string } }) {
  try {
    await connectDB();
    // Parse the JSON body sent from the client
    const updatedData = await req.json();

    // Update only provided fields
    const updateUser = await User.findOneAndUpdate(
      { clerkID: params.clerkID },
      { $set: updatedData },
      { new: true, runValidators: true },
    );

    if (!updateUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updateUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

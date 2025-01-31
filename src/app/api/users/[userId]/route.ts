import { NextRequest, NextResponse } from "next/server";
import User from "@/database/userSchema";
import connectDB from "@/database/db";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await connectDB();
    const user = await User.findById(params.userId);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Overwrite all user data (except Mongo _id) with the request body
export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await connectDB();
    // Parse the JSON body sent from the client
    const updatedData = await req.json();

    // Use overwrite: true to replace the entire document with updatedData.
    // 'new: true' returns the updated user document instead of the old one.
    const replacedUser = await User.findByIdAndUpdate(params.userId, updatedData, { new: true, overwrite: true });

    if (!replacedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(replacedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

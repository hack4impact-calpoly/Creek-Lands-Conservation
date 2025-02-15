// src/app/api/user/delete-profile-picture/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import { deleteFileFromS3 } from "@/lib/s3";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    // Retrieve the authenticated user's ID
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Look up the user using the authenticated clerkID (userId)
    const user = await User.findOne({ clerkID: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from S3 if an image exists
    if (user.imageKey) {
      await deleteFileFromS3(user.imageKey);
    }

    // Clear image data from the DB
    user.imageUrl = "";
    user.imageKey = "";
    await user.save();

    return NextResponse.json({ message: "Profile picture deleted", user });
  } catch (error: any) {
    console.error("Error deleting profile picture:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

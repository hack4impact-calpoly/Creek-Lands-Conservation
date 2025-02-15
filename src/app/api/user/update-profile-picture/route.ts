// src/app/api/user/update-profile-picture/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import { deleteFileFromS3 } from "@/lib/s3";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    // Get the authenticated user's ID
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { fileUrl, fileKey } = await req.json();
    if (!fileUrl || !fileKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the user using the authenticated clerkID (userId)
    const user = await User.findOne({ clerkID: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If an old image exists, delete it from S3
    if (user.imageKey) {
      await deleteFileFromS3(user.imageKey);
    }

    // Update the user with the new image data
    user.imageUrl = fileUrl;
    user.imageKey = fileKey;
    await user.save();

    return NextResponse.json({ message: "Profile picture updated", user });
  } catch (error: any) {
    console.error("Error updating user image:", error);
    return NextResponse.json({ error: "Failed to update user image" }, { status: 500 });
  }
}

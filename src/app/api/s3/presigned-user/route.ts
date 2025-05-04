import { NextRequest, NextResponse } from "next/server";
import { getUserUploadPresignedUrl } from "@/lib/s3";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user's ID from Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    const mimetype = searchParams.get("mimetype");

    if (!fileName || !mimetype) {
      return NextResponse.json({ error: "Missing fileName or mimetype" }, { status: 400 });
    }

    // Use the authenticated userId as the clerkID for folder structure in S3
    const { uploadUrl, fileUrl, key } = await getUserUploadPresignedUrl("user-profiles", fileName, mimetype, userId);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return NextResponse.json({ error: "Failed to generate pre-signed URL" }, { status: 500 });
  }
}

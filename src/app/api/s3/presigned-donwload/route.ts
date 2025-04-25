import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import { getAuth } from "@clerk/nextjs/server";
import { authenticateAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get("fileKey");
    if (!fileKey) {
      return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
    }

    // Add validation (e.g., ensure fileKey matches allowed prefixes)
    if (!fileKey.match(/^(event-images|user-profiles|waivers)\/.+/)) {
      return NextResponse.json({ error: "Invalid fileKey" }, { status: 403 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
    });

    // Generate a presigned GET URL (e.g., valid for 5 minutes)
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating presigned GET URL:", error);
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}

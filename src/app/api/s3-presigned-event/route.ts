import { NextRequest, NextResponse } from "next/server";
import { getUploadPresignedUrl } from "@/lib/s3";
import { deleteFileFromS3 } from "@/lib/s3";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    const mimetype = searchParams.get("mimetype");

    if (!fileName || !mimetype) {
      return NextResponse.json({ error: "Missing fileName or mimetype" }, { status: 400 });
    }

    // Store event images in "event-images" folder
    const { uploadUrl, fileUrl, key } = await getUploadPresignedUrl("event-images", fileName, mimetype);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fileKey } = await req.json();
    if (!fileKey) {
      return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
    }

    await deleteFileFromS3(fileKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}

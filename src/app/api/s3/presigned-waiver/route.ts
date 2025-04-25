import { NextRequest, NextResponse } from "next/server";
import { getUploadPresignedUrl } from "@/lib/s3";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    const mimetype = searchParams.get("mimetype");
    const type = searchParams.get("type"); // "template" or "completed"

    if (!fileName || !mimetype || !type) {
      return NextResponse.json({ error: "Missing fileName, mimetype, or type" }, { status: 400 });
    }

    // Construct folder path based on the type
    const folder = `waivers/${type === "template" ? "templates" : "completed"}`;
    // => "waivers/templates" or "waivers/completed"

    const { uploadUrl, fileUrl, key } = await getUploadPresignedUrl(folder, fileName, mimetype);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}

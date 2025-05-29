import { NextRequest, NextResponse } from "next/server";
import { getUserUploadPresignedUrl } from "@/lib/s3";
import { getAuth } from "@clerk/nextjs/server";
import { authenticateAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId || !(await authenticateAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    const mimetype = searchParams.get("mimetype");
    const type = searchParams.get("type"); // "template" or "completed"
    const eventId = searchParams.get("eventId");

    if (!fileName || !mimetype || !type || !eventId) {
      return NextResponse.json({ error: "Missing fileName, mimetype, type, or eventId" }, { status: 400 });
    }

    // Construct folder path based on the type
    const folder = `waivers/${type === "template" ? "templates" : "completed"}/${eventId}`;
    // => "waivers/templates" or "waivers/completed"

    const { uploadUrl, fileUrl, key } = await getUserUploadPresignedUrl(folder, fileName, mimetype);

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { deleteFileFromS3, getImageUploadPresignedUrl } from "@/lib/s3";
import { authenticateAdmin } from "@/lib/auth";
import Event from "@/database/eventSchema";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId || !(await authenticateAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");
  const mimetype = searchParams.get("mimetype");
  const eventId = searchParams.get("eventId");

  if (!fileName || !mimetype || !eventId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { uploadUrl, fileUrl, key } = await getImageUploadPresignedUrl("event-images", fileName, mimetype, eventId);
  return NextResponse.json({ uploadUrl, fileUrl, key });
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId || !(await authenticateAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { fileKey } = await req.json();
  if (!fileKey) {
    return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
  }

  await deleteFileFromS3(fileKey);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { listFilesFromS3 } from "@/lib/s3";
import { authenticateAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authError = await authenticateAdmin();
    if (authError !== true) return authError;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    const allImages = await listFilesFromS3("event-images/");
    const totalImages = allImages.length;
    const totalPages = Math.ceil(totalImages / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const images = allImages.slice(startIndex, endIndex);

    return NextResponse.json({ images, totalPages, total: totalImages });
  } catch (error) {
    console.error("Error listing files from S3:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

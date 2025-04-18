import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";

export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  return NextResponse.json({ message: `GET request received for event ${params.eventID}` });
}

export async function POST(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const user = await User.findOne({ clerkID: userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { signatureBase64 } = await req.json();
  if (!signatureBase64) {
    return NextResponse.json({ error: "No signature provided." }, { status: 400 });
  }

  try {
    const pdfPath = path.join(process.cwd(), "public", "waiver.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const page = pdfDoc.getPages()[0];
    const pngImage = await pdfDoc.embedPng(signatureBase64);
    const { width, height } = pngImage.scale(0.5);

    // Place the signature somewhere fixed, e.g., bottom right
    page.drawImage(pngImage, {
      x: page.getWidth() - width - 50,
      y: 50,
      width,
      height,
    });

    const modifiedPdf = await pdfDoc.save();

    const signedFilename = `waiver-signed-${eventID}-${user._id}.pdf`;
    const outputPath = path.join(process.cwd(), "public", "signed-waivers", signedFilename);
    const outputDir = path.join(process.cwd(), "public", "signed-waivers");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, modifiedPdf);

    return NextResponse.json({ message: "Waiver signed!", signedPdfUrl: `/signed-waivers/${signedFilename}` });
  } catch (error) {
    console.error("Error processing waiver:", error);
    return NextResponse.json({ error: "Failed to sign waiver." }, { status: 500 });
  }
}

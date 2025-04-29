import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import { PdfReader } from "pdfreader"; // Importing pdfreader

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
    const waiverName = "waiver2";
    const pdfPath = path.join(process.cwd(), "public", `${waiverName}.pdf`);
    const pdfBytes = fs.readFileSync(pdfPath);

    // Use pdfreader to extract text and find the word 'SIGNATURE' first, then fall back to 'sign'
    const positions = await extractTextAndFindSign(pdfPath);

    // Choose the first position to place the signature (can be refined based on the business logic)
    const signPosition = positions[0];

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[signPosition.page - 1];
    const pdfWidth = page.getWidth();
    const pdfHeight = page.getHeight();

    const pngImage = await pdfDoc.embedPng(signatureBase64);
    const { width, height } = pngImage.scale(0.35); // Scale signature image

    // Scale reader's x/y into PDF's coordinate space
    const scaledX = (signPosition.x / 100) * 2 * pdfWidth;
    const scaledY = pdfHeight - (signPosition.y / 100) * 2 * pdfHeight; // Invert y-axis

    page.drawImage(pngImage, {
      x: scaledX,
      y: scaledY,
      width,
      height,
    });

    const modifiedPdf = await pdfDoc.save();

    const signedFilename = `${waiverName}-signed-${eventID}-${user._id}.pdf`;
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

// Function to extract text and find positions for exact 'SIGNATURE' or fallback to 'sign'
async function extractTextAndFindSign(pdfPath: string) {
  return new Promise((resolve, reject) => {
    const exactMatches: any[] = [];
    const fallbackMatches: any[] = [];
    let currentPage = 0;

    new PdfReader().parseFileItems(pdfPath, (err, item) => {
      if (err) return reject(err);

      if (item?.page) {
        currentPage = item.page;
      }

      if (item && item.text) {
        const text = item.text.trim();
        const normalized = text.replace(/\s+/g, "").toLowerCase(); // Remove spaces for matching

        if (/^signature$/.test(normalized)) {
          console.log(`[MATCH: EXACT] Page ${currentPage}: "${text}"`);
          exactMatches.push({ x: item.x, y: item.y, page: currentPage, text });
        } else if (/^signa/.test(normalized)) {
          console.log(`[MATCH: FALLBACK] Page ${currentPage}: "${text}"`);
          fallbackMatches.push({ x: item.x, y: item.y, page: currentPage, text });
        }
      }

      if (!item) {
        const finalMatches = exactMatches.length > 0 ? exactMatches : fallbackMatches;
        resolve(finalMatches);
      }
    });
  });
}

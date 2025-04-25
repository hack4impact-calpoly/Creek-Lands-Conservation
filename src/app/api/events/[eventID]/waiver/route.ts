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
    const pdfPath = path.join(process.cwd(), "public", "waiver.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);

    // Use pdfreader to extract text and find the word 'Signature'
    const positions = await extractTextAndFindSign(pdfPath);

    if (positions.length === 0) {
      return NextResponse.json({ error: "No 'Signature' found in the document" }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Use the position of the first "Signature" found
    const signPosition = positions[0]; // Assume the first occurrence is where you want to place the signature

    const page = pdfDoc.getPages()[signPosition.page - 1];
    const pdfWidth = page.getWidth();
    const pdfHeight = page.getHeight();
    console.log("PDF dimensions:", pdfWidth, pdfHeight);
    const pngImage = await pdfDoc.embedPng(signatureBase64);
    const { width, height } = pngImage.scale(0.35); // or use .scaleToFit(maxWidth, maxHeight)

    // Scale reader's x/y into PDF's coordinate space
    const scaledX = (signPosition.x / 100) * 2 * pdfWidth;
    const scaledY = pdfHeight - (signPosition.y / 100) * 2 * pdfHeight; // invert y-axis
    console.log("Scaled coords:", { x: scaledX, y: scaledY, pdfHeight });

    // Adjust the position to ensure the signature is placed properly (you can fine-tune this)
    page.drawImage(pngImage, {
      x: scaledX,
      y: scaledY,
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

// Function to extract text and find position of the word "Sign"
async function extractTextAndFindSign(pdfPath) {
  return new Promise((resolve, reject) => {
    const positions = [];
    let currentPage = 0;
    new PdfReader().parseFileItems(pdfPath, (err, item) => {
      if (err) reject(err);

      if (item?.page) {
        currentPage = item.page;
      }

      if (item && item.text) {
        const regex = /\bSignature\b/i; // Look for the word 'Signature'
        if (regex.test(item.text)) {
          console.log(`Found text: "${item.text}" at x=${item.x}, y=${item.y}`);
          // Capture position of the word 'Sign'
          positions.push({
            x: item.x,
            y: item.y,
            page: currentPage,
            text: item.text,
          });
        }
      }

      if (!item) {
        resolve(positions);
      }
    });
  });
}

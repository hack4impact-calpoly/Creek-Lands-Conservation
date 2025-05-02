import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/database/db";
import User from "@/database/userSchema";
import Event from "@/database/eventSchema";
import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";
import { PdfReader } from "pdfreader"; // Importing pdfreader
import { s3 } from "@/lib/s3"; // Ensure you've set up an s3 instance for uploads
import { GetObjectCommand } from "@aws-sdk/client-s3"; // Import GetObjectCommand to retrieve files from S3

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

  const { signatureBase64, fileKey } = await req.json(); // Accept fileKey as part of the request body
  if (!signatureBase64 || !fileKey) {
    return NextResponse.json({ error: "No signature or fileKey provided." }, { status: 400 });
  }

  try {
    // Fetch the unsigned waiver from S3 using the fileKey
    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME, // Ensure this is set in your environment
      Key: fileKey, // The fileKey provided in the request
    };

    const s3Object = await s3.send(new GetObjectCommand(getObjectParams));

    // Read the file from S3 and convert it into a PDF byte array
    const pdfBytes = await streamToBuffer(s3Object.Body); // Convert S3 stream to buffer

    // Use pdfreader to extract text and find the word 'SIGNATURE' first, then fall back to 'sign'
    const positions = await extractTextAndFindSign(pdfBytes);

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

    // Generate a unique file key for the signed version in S3
    const signedFilename = `waiver-signed-${eventID}-${user._id}.pdf`;
    const s3Key = `waivers/completed/${eventID}/${user._id}/${signedFilename}`;

    // Upload the signed waiver to S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: modifiedPdf,
      ContentType: "application/pdf",
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Generate a publicly accessible URL to the uploaded file
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      message: "Waiver signed and uploaded!",
      signedPdfUrl: fileUrl, // Return the S3 URL where the file can be accessed
    });
  } catch (error) {
    console.error("Error processing waiver:", error);
    return NextResponse.json({ error: "Failed to sign waiver." }, { status: 500 });
  }
}

// Function to extract text and find positions for exact 'SIGNATURE' or fallback to 'sign'
async function extractTextAndFindSign(pdfBytes: Buffer) {
  return new Promise((resolve, reject) => {
    const exactMatches: any[] = [];
    const fallbackMatches: any[] = [];
    let currentPage = 0;

    new PdfReader().parseBuffer(pdfBytes, (err, item) => {
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

// Helper function to convert S3 stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

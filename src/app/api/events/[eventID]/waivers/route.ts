import connectDB from "@/database/db";
import Event, { IEvent } from "@/database/eventSchema";
import Waiver, { IWaiver } from "@/database/waiverSchema";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import User from "@/database/userSchema";
import { PDFDocument } from "pdf-lib";
import { PdfReader } from "pdfreader";
import { s3 } from "@/lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: NextRequest, { params }: { params: { eventID: string } }) {
  await connectDB();
  const { eventID } = params;

  if (!mongoose.Types.ObjectId.isValid(eventID)) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    const waivers = await Waiver.find({ eventId: eventID, type: "template" });
    return NextResponse.json({ waivers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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

  const { signatureBase64, waiverID, templateKey } = await req.json();

  if (!signatureBase64 || !waiverID || !templateKey) {
    return NextResponse.json({ error: "Missing signatureBase64, waiverID, or templateKey." }, { status: 400 });
  }

  try {
    // Fetch the unsigned PDF template from S3
    const s3Object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: templateKey,
      }),
    );
    const pdfBytes = await streamToBuffer(s3Object.Body);
    const positions = await extractTextAndFindSign(pdfBytes);

    if (positions.length === 0) {
      return NextResponse.json({ error: "No signature position found in the document." }, { status: 400 });
    }

    const signPosition = positions[0];
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[signPosition.page - 1];
    const pdfWidth = page.getWidth();
    const pdfHeight = page.getHeight();

    const pngImage = await pdfDoc.embedPng(signatureBase64);
    const { width, height } = pngImage.scale(0.35);

    const scaledX = (signPosition.x / 100) * 2 * pdfWidth;
    const scaledY = pdfHeight - (signPosition.y / 100) * 2 * pdfHeight;

    page.drawImage(pngImage, {
      x: scaledX,
      y: scaledY,
      width,
      height,
    });

    const modifiedPdf = await pdfDoc.save();

    // upload to S3
    // Convert the signed PDF to a Buffer
    const buffer = Buffer.from(modifiedPdf);

    // Define the S3 file key and file name
    const fileName = `${user._id}-${waiverID}.pdf`; // File name using the user ID and waiver ID
    const fileKey = `waivers/completed/${eventID}/${user._id}/${fileName}`; // File path in S3

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: "application/pdf", // Ensure the content type is set correctly
    };

    // Perform the S3 upload
    await s3.send(new PutObjectCommand(uploadParams));

    // Construct the file URL after upload
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    console.log(fileUrl);

    // Save waiver to DB
    const newWaiver = await Waiver.create({
      fileKey,
      fileName,
      uploadedBy: user._id,
      belongsToUser: user._id,
      isForChild: false,
      type: "completed",
      templateRef: waiverID,
      eventId: new mongoose.Types.ObjectId(eventID),
    });

    user.waiversSigned.push(newWaiver._id);
    await user.save();

    return NextResponse.json({
      message: "Waiver signed and uploaded!",
      signedPdfUrl: downloadUrl,
    });
  } catch (error: any) {
    console.error("Error processing waiver:", error);
    return NextResponse.json({ error: error.message || "Failed to sign waiver." }, { status: 500 });
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

// Helper function to convert a stream to a buffer (for S3 file content)
async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

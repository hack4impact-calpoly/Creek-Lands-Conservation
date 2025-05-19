import connectDB from "@/database/db";
import Event, { IEvent } from "@/database/eventSchema";
import Waiver, { IWaiver } from "@/database/waiverSchema";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import User from "@/database/userSchema";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { PdfReader } from "pdfreader";
import { s3 } from "@/lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { rgb } from "pdf-lib";

interface PdfReaderItem {
  page?: number;
  text?: string;
  x?: number;
  y?: number;
}

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

  const { signatureBase64, waiverID, templateKey, participants } = await req.json();

  if (!signatureBase64 || !waiverID || !templateKey || !Array.isArray(participants)) {
    return NextResponse.json(
      { error: "Missing signatureBase64, waiverID, templateKey, or participants list." },
      { status: 400 },
    );
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

    if (!Array.isArray(positions)) {
      return NextResponse.json({ error: "Invalid response format from extractTextAndFindSign." }, { status: 500 });
    }

    if (positions.length === 0) {
      return NextResponse.json({ error: "No signature position found in the document." }, { status: 400 });
    }

    const signPosition = positions[0];
    const signedWaiverIDs: mongoose.Types.ObjectId[] = [];
    const signedPdfUrls: string[] = [];

    for (const participant of participants) {
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

      // Add the user’s name above the participant's name
      const userName = `${user.firstName} ${user.lastName}`; // Assuming user has firstName and lastName
      const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
      const fontSize = 12; // Set an appropriate font size
      const textWidth = font.widthOfTextAtSize(userName, fontSize);

      // Position the user’s name above the signature
      const textX = scaledX + (width - textWidth) / 2; // Center the text
      const textY = scaledY - height - 11; // Position 5 units above the signature image

      page.drawText(userName, {
        x: textX,
        y: textY,
        font,
        size: fontSize,
        color: rgb(0, 0, 0), // Text color (black)
      });

      // Add participant's name below the user’s name
      const participantName = `${participant.firstName} ${participant.lastName}`;
      const participantTextWidth = font.widthOfTextAtSize(participantName, fontSize);

      // Position the participant's name below the user's name
      const participantTextX = scaledX + (width - participantTextWidth) / 2; // Center the text below
      const participantTextY = textY - fontSize - 31; // Position the participant's name below the user’s name

      page.drawText(participantName, {
        x: participantTextX,
        y: participantTextY,
        font,
        size: fontSize,
        color: rgb(0, 0, 0), // Text color (black)
      });

      const modifiedPdf = await pdfDoc.save();
      const buffer = Buffer.from(modifiedPdf);

      const fileName = `${participant.userID}-${waiverID}.pdf`;
      const fileKey = `waivers/completed/${eventID}/${user._id}/${fileName}`;

      console.log(fileKey);

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: "application/pdf",
        }),
      );

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
      signedPdfUrls.push(fileUrl);

      const newWaiver = await Waiver.create({
        fileKey,
        fileName,
        uploadedBy: user._id,
        belongsToUser: user._id,
        isForChild: participant.isChild,
        childSubdocId: participant.isChild ? participant.userID : undefined,
        type: "completed",
        templateRef: waiverID,
        eventId: new mongoose.Types.ObjectId(eventID),
      });

      if (participant.isChild) {
        const child = user.children.id(participant.userID); // participant.userID is the _id of the child subdoc
        if (child) {
          child.waiversSigned.push(newWaiver._id);
          await user.save(); // Save parent document
        } else {
          console.warn(`Child with ID ${participant.userID} not found in user ${user._id}`);
        }
      } else {
        user.waiversSigned.push(newWaiver._id);
        await user.save();
      }
    }

    return NextResponse.json({
      message: "Waivers signed and uploaded for all participants.",
      signedPdfUrls,
    });
  } catch (error: any) {
    console.error("Error processing waivers:", error);
    return NextResponse.json({ error: error.message || "Failed to sign waivers." }, { status: 500 });
  }
}

// Function to extract text and find positions for exact 'SIGNATURE' or fallback to 'sign'
async function extractTextAndFindSign(
  pdfBytes: Buffer,
): Promise<{ x: number; y: number; page: number; text: string }[]> {
  return new Promise((resolve, reject) => {
    const exactMatches: { x: number; y: number; page: number; text: string }[] = [];
    const fallbackMatches: { x: number; y: number; page: number; text: string }[] = [];
    let currentPage = 0;

    new PdfReader().parseBuffer(pdfBytes, (err: string | Error | null, item: PdfReaderItem | null) => {
      if (err) return reject(err);

      if (item?.page) {
        currentPage = item.page;
      }

      if (item && item.text && typeof item.x === "number" && typeof item.y === "number") {
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

// Helper function to convert a stream to a buffer (for S3 file content)
async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

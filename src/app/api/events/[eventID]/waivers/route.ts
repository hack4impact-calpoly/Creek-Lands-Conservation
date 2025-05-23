import connectDB from "@/database/db";
import Event, { IEvent } from "@/database/eventSchema";
import Waiver, { IWaiver } from "@/database/waiverSchema";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import User from "@/database/userSchema";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PdfReader } from "pdfreader";
import { s3 } from "@/lib/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

interface PdfReaderItem {
  page?: number;
  text?: string;
  x?: number;
  y?: number;
  w?: number;
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

    // Find the position of the first "date" (case-insensitive)
    const datePosition = await findDatePosition(pdfBytes);
    if (!datePosition) {
      console.warn("No 'date' (case-insensitive) found in the document.");
    } else {
      //console.log("Found 'date' at:", datePosition);
    }

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

    // Get today's date
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    for (const participant of participants) {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPages()[signPosition.page - 1];
      const pdfWidth = page.getWidth();
      const pdfHeight = page.getHeight();

      // Inject today's date if position is found
      // Inject today's date if position is found
      if (datePosition) {
        const datePage = pdfDoc.getPages()[datePosition.page - 1];

        // Use coordinates directly as they are in points
        //const dateTextX = datePosition.x;
        //const dateTextY = datePosition.y - 1; // Slight offset above the line for visibility

        const scaledDateX = (datePosition.x / 100) * 2.7 * pdfWidth;
        const scaledDateY = pdfHeight - (datePosition.y / 100) * 2.05 * pdfHeight;

        /*console.log(
          `Injecting date '${formattedDate}' at page ${datePosition.page}, x=${scaledDateX}, y=${scaledDateY}`,
        );*/

        const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
        const fontSize = 12;
        datePage.drawText(formattedDate, {
          x: scaledDateX,
          y: scaledDateY,
          font,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }

      // Add signature
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
      const userName = `${user.firstName} ${user.lastName}`;
      const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const textWidth = font.widthOfTextAtSize(userName, fontSize);

      const textX = scaledX + (width - textWidth) / 2;
      const textY = scaledY - height - 11;

      page.drawText(userName, {
        x: textX,
        y: textY,
        font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      // Add participant's name below the user’s name
      const participantName = `${participant.firstName} ${participant.lastName}`;
      const participantTextWidth = font.widthOfTextAtSize(participantName, fontSize);

      const participantTextX = scaledX + (width - participantTextWidth) / 2;
      const participantTextY = textY - fontSize - 31;

      page.drawText(participantName, {
        x: participantTextX,
        y: participantTextY,
        font,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      const modifiedPdf = await pdfDoc.save();
      const buffer = Buffer.from(modifiedPdf);

      const fileName = `${participant.userID}-${waiverID}.pdf`;
      const fileKey = `waivers/completed/${eventID}/${user._id}/${fileName}`;

      //console.log(fileKey);

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
      // Check if a waiver already exists for this participant and event
      const existingWaiver = await Waiver.findOne({
        eventId: eventID,
        templateRef: waiverID,
        type: "completed",
        ...(participant.isChild ? { childSubdocId: participant.userID } : { belongsToUser: user._id }),
      });

      // check for waiver duplication
      if (existingWaiver) {
        console.log("Waiver object already exists in MongoDB");
        // update the existing waiver
        existingWaiver.fileKey = fileKey;
        existingWaiver.fileName = fileName;
        existingWaiver.uploadedBy = user._id;
        existingWaiver.isForChild = participant.isChild;
        existingWaiver.childSubdocId = participant.isChild ? participant.userID : undefined;
        await existingWaiver.save();
      } else {
        // create new waiver
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

        // only push to user.children or user.waiversSigned if it's a new waiver
        if (participant.isChild) {
          const child = user.children.id(participant.userID);
          if (child && !child.waiversSigned.includes(newWaiver._id)) {
            child.waiversSigned.push(newWaiver._id);
            await user.save();
          }
        } else {
          if (!user.waiversSigned.includes(newWaiver._id)) {
            user.waiversSigned.push(newWaiver._id);
            await user.save();
          }
        }
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
        const normalized = text.replace(/\s+/g, "").toLowerCase();

        if (/^signature$/.test(normalized)) {
          //console.log(`[MATCH: EXACT] Page ${currentPage}: "${text}"`);
          exactMatches.push({ x: item.x, y: item.y, page: currentPage, text });
        } else if (/^signa/.test(normalized)) {
          //console.log(`[MATCH: FALLBACK] Page ${currentPage}: "${text}"`);
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

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// Commenting out the logs directory creation for now
// Ensure logs directory exists
/*const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Generate log file path with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFilePath = path.join(logsDir, `pdf-text-log-${timestamp}.txt`);*/

async function findDatePosition(
  pdfBytes: Buffer,
): Promise<{ x: number; y: number; page: number; width: number } | null> {
  return new Promise((resolve, reject) => {
    let currentPage = 0;
    let found = false; // Track if the position was found

    new PdfReader().parseBuffer(pdfBytes, (err: string | Error | null, item: any) => {
      if (err) {
        const errorMessage = `[DEBUG_ERROR] Error processing PDF: ${err}\n`;
        console.error(errorMessage);
        //fs.appendFileSync(logFilePath, errorMessage, "utf8");
        return reject(err);
      }

      if (item?.page) {
        currentPage = item.page;
        //const logMessage = `[DEBUG] Processing Page ${currentPage}\n`;
        //console.log(logMessage);
        //fs.appendFileSync(logFilePath, logMessage, "utf8");
      }

      if (item && item.text && typeof item.x === "number" && typeof item.y === "number") {
        const text = item.text.trim();
        //const logMessage = `[DEBUG_RAW] Text="${text}", x=${item.x}, y=${item.y}, width=${item.w || "undefined"}\n`;
        //console.log(logMessage);
        //fs.appendFileSync(logFilePath, logMessage, "utf8");

        // Check for the specific underline for the date field
        if (
          text === "__________________" &&
          Math.abs(item.x - 20) < 0.1 && // Match x=20
          Math.abs(item.y - 26.854) < 0.1 && // Match y=26.854
          Math.abs(item.w - 143.438) < 0.1 // Match width=143.438
        ) {
          found = true; // Set flag to true
          const result = {
            x: item.x,
            y: item.y,
            page: currentPage,
            width: item.w,
          };
          //const foundMessage = `[DEBUG] Found date underline at: ${JSON.stringify(result)}\n`;
          //console.log(foundMessage);
          //fs.appendFileSync(logFilePath, foundMessage, "utf8");
          resolve(result);
          return;
        }
      }

      if (!item && !found) {
        // Only log and resolve null if not found
        //const logMessage = "[DEBUG] No matching date underline found in the document.\n";
        //console.log(logMessage);
        //fs.appendFileSync(logFilePath, logMessage, "utf8");
        resolve(null);
      }
    });
  });
}

async function logAllPdfText(pdfBytes: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    let currentPage = 0;
    const lines: { y: number; items: { text: string; x: number; y: number; w: number }[] }[] = [];

    new PdfReader().parseBuffer(pdfBytes, (err: string | Error | null, item: any) => {
      if (err) {
        const errorMessage = `[PDF_TEXT_ERROR] Error processing PDF: ${err}\n`;
        console.error(errorMessage);
        //fs.appendFileSync(logFilePath, errorMessage, "utf8");
        return reject(err);
      }

      if (item?.page) {
        currentPage = item.page;
        //const logMessage = `[PDF_TEXT] Page ${currentPage}:\n`;
        //console.log(logMessage);
        //fs.appendFileSync(logFilePath, logMessage, "utf8");
      }

      if (item && item.text && typeof item.x === "number" && typeof item.y === "number") {
        const text = item.text.trim();
        //const logMessage = `[PDF_TEXT_RAW] Text="${text}", x=${item.x}, y=${item.y}, width=${item.w || "undefined"}\n`;
        //console.log(logMessage);
        //fs.appendFileSync(logFilePath, logMessage, "utf8");

        // Group text items by y-coordinate
        let line = lines.find((l) => Math.abs(l.y - item.y) < 0.1);
        if (!line) {
          line = { y: item.y, items: [] };
          lines.push(line);
        }
        line.items.push({ text, x: item.x, y: item.y, w: item.w || 50 });
      }

      if (!item) {
        // Process each line to reconstruct words
        for (const line of lines) {
          line.items.sort((a, b) => a.x - b.x);

          let currentWord = "";
          let startX = 0;
          let totalWidth = 0;
          let lastX = 0;
          let lastWidth = 0;

          for (let i = 0; i <= line.items.length; i++) {
            const currentItem = line.items[i];
            const isLast = i === line.items.length;

            if (isLast || (currentItem && lastX && currentItem.x - (lastX + lastWidth) > 2)) {
              if (currentWord) {
                //const wordMessage = `[PDF_TEXT_WORD] Reconstructed Word="${currentWord}", x=${startX}, y=${line.y}, width=${totalWidth}\n`;
                //console.log(wordMessage);
                //fs.appendFileSync(logFilePath, wordMessage, "utf8");
              }
              currentWord = "";
              totalWidth = 0;
            }

            if (!isLast) {
              if (!currentWord) startX = currentItem.x;
              currentWord += currentItem.text;
              totalWidth += currentItem.w;
              lastX = currentItem.x;
              lastWidth = currentItem.w;
            }
          }
        }

        //const logMessage = "[PDF_TEXT] Finished processing PDF.\n";
        //console.log(logMessage);
        //fs.appendFileSync(logFilePath, logMessage, "utf8");
        resolve();
      }
    });
  });
}

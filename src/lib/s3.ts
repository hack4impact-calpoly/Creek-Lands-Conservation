import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/** Utility to generate a random unique file name */
function generateUniqueFileName(originalName: string) {
  const randomString = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${randomString}-${originalName}`;
}

/**
 * Generates a pre-signed URL for PUT uploads.
 * e.g. folder = "user", "waiver/completed", etc.
 */
export async function getUploadPresignedUrl(folder: string, originalName: string, mimetype: string, clerkId?: string) {
  const fileName = generateUniqueFileName(originalName);
  // If you want subfolders by user ID:
  const subPath = clerkId ? `${folder}/${clerkId}` : folder;
  const key = `${subPath}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: mimetype,
  });

  // Pre-signed URL expires in 60 seconds
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

/** Deletes a file from S3 by key. */
export async function deleteFileFromS3(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
  });
  await s3.send(command);
  console.log("Deleted file from S3:", fileKey);
}

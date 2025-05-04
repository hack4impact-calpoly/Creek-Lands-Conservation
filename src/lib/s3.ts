import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

interface S3File {
  url: string;
  key: string;
  lastModified?: string;
}

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
export async function getUserUploadPresignedUrl(
  folder: string,
  originalName: string,
  mimetype: string,
  clerkId?: string,
) {
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

export async function listFilesFromS3(prefix: string): Promise<S3File[]> {
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const region = process.env.AWS_REGION!;
  let continuationToken: string | undefined;
  const allFiles: S3File[] = [];

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });
    const res = await s3.send(cmd);

    // filter out “directories” (and/or only allow real image extensions)
    const files = (res.Contents || [])
      .filter((item) => {
        if (!item.Key) return false;
        // skip the folder itself
        if (item.Key.endsWith("/")) return false;
        // optional: only allow certain extensions
        return /\.(jpe?g|png|gif|webp|svg)$/i.test(item.Key);
      })
      .map((item) => ({
        url: `https://${bucketName}.s3.${region}.amazonaws.com/${item.Key}`,
        key: item.Key!,
        lastModified: item.LastModified?.toISOString(),
      }));

    allFiles.push(...files);
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return allFiles;
}

/**
 * Generates a pre-signed URL for PUT uploads.
 * e.g. folder = "event-images", etc.
 */
export async function getImageUploadPresignedUrl(
  folder: string,
  originalName: string,
  mimetype: string,
  eventId: string,
) {
  if (!eventId) throw new Error("eventId is required for event images");

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedMimeTypes.includes(mimetype)) {
    throw new Error("Invalid file type");
  }

  const fileName = generateUniqueFileName(originalName);
  const key = `${folder}/${eventId}/${fileName}`;

  // Generate presigned URL (e.g., for AWS S3)
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: mimetype,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { uploadUrl, fileUrl, key };
}

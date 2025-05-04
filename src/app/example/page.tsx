"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [fileKey, setFileKey] = useState("");

  async function handleUpload() {
    if (!file) {
      setMessage("No file selected");
      return;
    }

    // Allow only PNG and JPEG images.
    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Invalid file type. Only PNG and JPEG images are allowed.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // 1) Request a presigned URL from your backend.
      const params = new URLSearchParams({
        fileName: file.name,
        mimetype: file.type,
      });
      const presignRes = await fetch(`/api/s3/presigned?${params.toString()}`);
      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || "Failed to get presigned URL");
      }
      const { uploadUrl, fileUrl, key } = await presignRes.json();

      // Store the fileKey for later use
      setFileKey(key);

      // 2) Upload the file directly to S3 using the presigned URL.
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // 3) Update the user document in MongoDB.
      const updateRes = await fetch("/api/user/update-profile-picture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl, fileKey: key }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.error || "Failed to update user document");
      }
      const updatedUser = await updateRes.json();
      setMessage("File uploaded and user updated!");

      // If you're storing the public fileUrl, you might leave imageUrl empty.
      // Instead, use fileKey to generate a presigned GET URL.
      // Optionally, set imageUrl to fileUrl if the file is public.
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  // Whenever fileKey is set, fetch a GET presigned URL.
  useEffect(() => {
    async function fetchImage() {
      if (!fileKey) return;
      const params = new URLSearchParams({ fileKey });
      const res = await fetch(`/api/s3/presigned-download?${params.toString()}`);
      if (!res.ok) {
        console.error("Failed to fetch image URL");
        return;
      }
      const { url } = await res.json();
      setImageUrl(url);
    }
    fetchImage();
  }, [fileKey]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Test File Upload</h1>
      <input
        type="file"
        accept="image/png, image/jpeg"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
          }
        }}
      />
      <button disabled={!file || uploading} onClick={handleUpload}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p>{message}</p>}
      {imageUrl && (
        <div style={{ marginTop: 20 }}>
          <h2>Uploaded Profile Picture</h2>
          <Image src={imageUrl} alt="Profile" width={300} height={300} />
        </div>
      )}
    </div>
  );
}

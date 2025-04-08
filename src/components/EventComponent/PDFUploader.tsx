"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { CloudUploadIcon, FileIcon, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type PDFType = "template" | "completed";

interface FileWithPreview extends File {
  preview: string;
}

interface PDFUploadProps {
  type: PDFType;
  onPDFsUploaded: (pdfs: { fileUrl: string; fileKey: string; fileName: string }[]) => void;
  resetFiles?: boolean;
}

export default function PDFUpload({ type, onPDFsUploaded, resetFiles }: PDFUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  /**
   * 1) Request a presigned URL from your "/api/s3-presigned-waiver"
   * 2) PUT the file to S3
   * 3) Return the final S3 file URL
   *
   * Here, we default to "type=template".
   * If you want "completed", you can pass that in or switch based on your scenario.
   */
  const uploadPDF = async (file: File): Promise<{ fileUrl: string; fileKey: string; fileName: string }> => {
    try {
      const fileName = `${Date.now()}-${file.name}`;

      // We assume all PDFs here are "templates."
      // For completed, you could pass: &type=completed
      const presignedRes = await fetch(
        `/api/s3-presigned-waiver?fileName=${encodeURIComponent(fileName)}` +
          `&mimetype=${encodeURIComponent(file.type)}` +
          `&type=${type}`,
      );
      if (!presignedRes.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { uploadUrl, fileUrl, key } = await presignedRes.json();

      // Upload to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      return { fileUrl, fileKey: key, fileName: file.name }; // The final S3 file location
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  };

  /**
   * Orchestrates uploading all selected PDFs, calls `onPDFsUploaded`.
   */
  const handleUpload = async () => {
    try {
      // Only proceed if we actually have files
      if (files.length === 0) return;

      // Upload all PDFs concurrently
      const uploadPromises = files.map((file) => uploadPDF(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      // Send back to parent
      onPDFsUploaded(uploadedUrls);

      toast({
        title: "PDFs uploaded successfully",
        variant: "success",
      });
    } catch (err) {
      console.error("Error uploading PDFs:", err);
      toast({
        title: "Error uploading PDFs",
        variant: "destructive",
      });
    }
  };

  /**
   * If you'd prefer manual uploading only, remove this effect
   * and let the user press a button. For now, we match the
   * FileUploader style: as soon as `files` changes, we upload.
   */
  React.useEffect(() => {
    if (files.length > 0) {
      handleUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  /**
   * Filter out duplicates, store local preview URL
   */
  const processFiles = (selectedFiles: File[]) => {
    const newFiles = selectedFiles.filter((newFile) => {
      const isDuplicate = files.some(
        (existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size,
      );
      return !isDuplicate;
    });

    const filesWithPreviews = newFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    );

    setFiles((prev) => [...prev, ...filesWithPreviews]);
  };

  /**
   * Basic drag-n-drop logic
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf");
    processFiles(droppedFiles);
  };

  /**
   * Normal file selection logic
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");
      processFiles(selectedFiles);
      e.target.value = "";
    }
  };

  /**
   * Remove a file from local list
   */
  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prev) => prev.filter((f) => f !== fileToRemove));
    if (fileToRemove.preview.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  /**
   * Clean up previews on unmount
   */
  React.useEffect(() => {
    const storedFiles = files;
    return () => {
      storedFiles.forEach((f) => {
        if (f.preview.startsWith("blob:")) {
          URL.revokeObjectURL(f.preview);
        }
      });
    };
  }, [files]);

  /**
   * Clear out local PDFs if `resetFiles` becomes true
   */
  React.useEffect(() => {
    if (resetFiles) {
      setFiles([]);
    }
  }, [resetFiles]);

  /**
   * (Optional) manual button to re-upload or just to demonstrate
   * how to call `handleUpload`. This is mostly for consistency
   * with your FileUploader approach.
   */
  const handleManualUpload = async () => {
    await handleUpload();
    // If you want to clear out local files after manual upload:
    setFiles([]);
  };

  /**
   * Carousel
   */
  React.useEffect(() => {
    if (carouselApi && selectedPdfIndex !== null) {
      carouselApi.scrollTo(selectedPdfIndex);
    }
  }, [carouselApi, selectedPdfIndex]);

  return (
    <>
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Upload Waiver PDFs</CardTitle>
          <CardDescription>Drag and drop your PDF files or click the button below to select files.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 space-y-6",
              isDragging ? "border-primary bg-primary/10" : "border-zinc-200 dark:border-zinc-800",
              "hover:border-primary transition-colors",
            )}
          >
            <input
              type="file"
              id="pdf-upload"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <CloudUploadIcon className="h-16 w-16 text-zinc-500 dark:text-zinc-400" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Select PDFs
            </Button>
          </div>

          {/* Preview + manual upload */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPdfIndex(0)}>
                    View All
                  </Button>
                  <Button variant="default" size="sm" onClick={handleManualUpload}>
                    Upload PDFs
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file, index) => (
                  <div
                    key={file.name + file.size}
                    className="group relative aspect-square cursor-pointer"
                    onClick={() => setSelectedPdfIndex(index)}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-muted p-4">
                      <FileIcon className="mb-2 h-10 w-10 text-muted-foreground" />
                      <p className="line-clamp-2 text-center text-xs text-muted-foreground">{file.name}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Carousel Preview */}
      <Dialog open={selectedPdfIndex !== null} onOpenChange={(open) => !open && setSelectedPdfIndex(null)}>
        <DialogContent className="h-[80vh] w-full max-w-[60vw] p-6">
          <Carousel setApi={setCarouselApi} className="h-full max-h-[85vh] w-full">
            <CarouselContent className="h-full max-h-[80vh]">
              {files.map((file) => (
                <CarouselItem key={file.name + file.size} className="h-full">
                  <div className="relative flex h-full w-full flex-col space-y-4">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <iframe src={`${file.preview}#toolbar=0`} className="h-full w-full rounded-lg" title={file.name} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
}

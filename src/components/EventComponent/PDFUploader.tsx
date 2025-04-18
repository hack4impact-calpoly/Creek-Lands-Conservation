"use client";

import * as React from "react";
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { CloudUploadIcon, FileIcon, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type PDFType = "template" | "completed";

interface FileWithPreview extends File {
  preview: string;
}

export interface PDFInfo {
  fileUrl: string;
  fileKey: string;
  fileName: string;
}

export interface PDFUploadProps {
  type: PDFType;
  onPDFsUploaded: (pdfs: PDFInfo[]) => void;
  resetFiles?: boolean;
}

export interface PDFUploadHandle {
  /** Uploads all staged PDFs to S3 and returns their info */
  uploadFiles: () => Promise<PDFInfo[]>;
  /** Clears all staged PDFs (revoking previews) */
  clear: () => void;
}

const PDFUpload = forwardRef<PDFUploadHandle, PDFUploadProps>(({ type, onPDFsUploaded, resetFiles }, ref) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 1) Get presigned URL → 2) PUT to S3 → 3) return final URL + key + name
  const uploadPDF = async (file: File): Promise<PDFInfo> => {
    const fileName = `${Date.now()}-${file.name}`;
    const presigned = await fetch(
      `/api/s3-presigned-waiver?fileName=${encodeURIComponent(
        fileName,
      )}&mimetype=${encodeURIComponent(file.type)}&type=${type}`,
    );
    if (!presigned.ok) throw new Error("Presign failed");
    const { uploadUrl, fileUrl, key } = await presigned.json();
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    return { fileUrl, fileKey: key, fileName: file.name };
  };

  // Batch‑upload callable by parent
  const handleUpload = async (): Promise<PDFInfo[]> => {
    if (files.length === 0) return [];
    const infos = await Promise.all(files.map(uploadPDF));
    onPDFsUploaded(infos);
    toast({ title: "PDFs uploaded successfully", variant: "success" });
    return infos;
  };

  // Expose uploadFiles() and clear() to parent
  useImperativeHandle(ref, () => ({
    uploadFiles: handleUpload,
    clear: () => {
      files.forEach((f) => {
        if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
    },
  }));

  // Stage new files and generate blob previews
  const processFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const unique = incoming.filter((f) => !prev.some((e) => e.name === f.name && e.size === f.size));
      const withPreviews = unique.map((f) => Object.assign(f, { preview: URL.createObjectURL(f) }));
      return [...prev, ...withPreviews];
    });
  };

  // Drag/drop handlers
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
    processFiles(Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf"));
  };

  // File‑picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files).filter((f) => f.type === "application/pdf"));
    e.target.value = "";
  };

  // Remove a single file
  const removeFile = (file: FileWithPreview) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    if (file.preview.startsWith("blob:")) URL.revokeObjectURL(file.preview);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  // Reset trigger
  useEffect(() => {
    if (resetFiles) setFiles([]);
  }, [resetFiles]);

  // Sync carousel scroll
  useEffect(() => {
    if (carouselApi && selectedPdfIndex !== null) {
      carouselApi.scrollTo(selectedPdfIndex);
    }
  }, [carouselApi, selectedPdfIndex]);

  return (
    <>
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Upload Waiver PDFs</CardTitle>
          <CardDescription>Drag and drop your PDFs or click to select PDFs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <CloudUploadIcon className="h-16 w-16 text-zinc-500 dark:text-zinc-400" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Select PDFs
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPdfIndex(0)}>
                    View All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file, idx) => (
                  <div
                    key={file.name + file.size}
                    className="group relative aspect-square cursor-pointer"
                    onClick={() => setSelectedPdfIndex(idx)}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted p-4">
                      <FileIcon className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-2 truncate text-center text-xs text-muted-foreground">{file.name}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100"
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

      <Dialog open={selectedPdfIndex !== null} onOpenChange={(open) => !open && setSelectedPdfIndex(null)}>
        <DialogContent className="h-[80vh] w-full max-w-[60vw] p-6">
          <Carousel setApi={setCarouselApi} className="h-full">
            <CarouselContent>
              {files.map((file) => (
                <CarouselItem key={file.name + file.size}>
                  <div className="flex h-full w-full flex-col space-y-4">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <iframe
                      src={`${file.preview}#toolbar=0`}
                      className="h-[70vh] w-full rounded-lg"
                      title={file.name}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
});

PDFUpload.displayName = "PDFUpload";
export default PDFUpload;

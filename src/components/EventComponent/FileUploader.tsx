"use client";

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import Image from "next/image";
import { CloudUploadIcon, FileIcon, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileWithPreview extends File {
  preview: string;
}

export interface FileUploadHandle {
  uploadFiles: () => Promise<string[]>;
  clear: () => void;
}

export interface FileUploadProps {
  onImagesUploaded: (urls: string[]) => void;
  resetFiles?: boolean;
}

const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(({ onImagesUploaded, resetFiles }, ref) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const presignedRes = await fetch(
      `/api/s3-presigned-event?fileName=${encodeURIComponent(fileName)}&mimetype=${file.type}`,
    );
    const { uploadUrl, fileUrl } = await presignedRes.json();
    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    return fileUrl;
  };

  useImperativeHandle(ref, () => ({
    uploadFiles: async () => {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const uploadedUrls = await Promise.all(imageFiles.map((f) => uploadFile(f)));
      onImagesUploaded(uploadedUrls);
      toast({ title: "Images uploaded successfully", variant: "success" });
      return uploadedUrls;
    },
    clear: () => {
      files.forEach((file) => {
        if (file.preview.startsWith("blob:")) URL.revokeObjectURL(file.preview);
      });
      setFiles([]);
    },
  }));

  const processFiles = (selectedFiles: File[]) => {
    const newFiles = selectedFiles.filter(
      (newFile) => !files.some((existing) => existing.name === newFile.name && existing.size === newFile.size),
    );
    const withPreviews = newFiles.map((file) =>
      Object.assign(file, {
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "/placeholder.svg?height=400&width=300",
      }),
    );
    setFiles((prev) => [...prev, ...withPreviews]);
  };

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
    const dropped = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf",
    );
    processFiles(dropped);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf",
    );
    processFiles(selected);
    e.target.value = "";
  };
  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prev) => prev.filter((f) => f !== fileToRemove));
    if (fileToRemove.preview.startsWith("blob:")) URL.revokeObjectURL(fileToRemove.preview);
  };

  useEffect(() => {
    if (resetFiles) {
      files.forEach((file) => {
        if (file.preview.startsWith("blob:")) URL.revokeObjectURL(file.preview);
      });
      setFiles([]);
    }
  }, [resetFiles]);

  useEffect(() => {
    const prev = files;
    return () => {
      prev.forEach((file) => {
        if (file.preview.startsWith("blob:")) URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  useEffect(() => {
    if (carouselApi && selectedImageIndex !== null) {
      carouselApi.scrollTo(selectedImageIndex);
    }
  }, [carouselApi, selectedImageIndex]);

  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  return (
    <>
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Upload Event Images</CardTitle>
          <CardDescription>Drag and drop your images or click to select files.</CardDescription>
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
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <CloudUploadIcon className="h-16 w-16 text-zinc-500 dark:text-zinc-400" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Select Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedImageIndex(0)}>
                    View All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file, idx) => (
                  <div
                    key={file.name + file.size}
                    className="group relative aspect-square cursor-pointer"
                    onClick={() => file.type.startsWith("image/") && setSelectedImageIndex(idx)}
                  >
                    {file.type.startsWith("image/") ? (
                      <Image src={file.preview} alt={file.name} fill className="rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
                        <FileIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-black/50 to-transparent p-2">
                      <p className="truncate text-xs text-white">{file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="p-4 sm:max-w-[800px] md:max-w-[900px]">
          <Carousel setApi={setCarouselApi}>
            <CarouselContent>
              {imageFiles.map((file) => (
                <CarouselItem key={file.name + file.size}>
                  <div className="relative aspect-[4/3] max-h-[600px] w-full">
                    <Image src={file.preview} alt={file.name} fill className="object-contain" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                      <p className="truncate text-center text-sm text-white">{file.name}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </DialogContent>
      </Dialog>
    </>
  );
});

FileUpload.displayName = "FileUpload";
export default FileUpload;

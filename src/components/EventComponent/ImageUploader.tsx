"use client";

import * as React from "react";
import { useState, useRef } from "react";
import Image from "next/image";
import { CloudUploadIcon, FileIcon, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface FileWithPreview extends File {
  preview: string;
}

export default function FileUpload() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (selectedFiles: File[]) => {
    // Filter out duplicates based on file name and size
    const newFiles = selectedFiles.filter((newFile) => {
      const isDuplicate = files.some(
        (existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size,
      );
      return !isDuplicate;
    });

    const filesWithPreviews = newFiles.map((file) =>
      Object.assign(file, {
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "/placeholder.svg?height=400&width=300",
      }),
    );

    setFiles((prev) => [...prev, ...filesWithPreviews]);
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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf",
    );
    processFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        (file) => file.type.startsWith("image/") || file.type === "application/pdf",
      );
      processFiles(selectedFiles);
      e.target.value = "";
    }
  };

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    // Only revoke the URL when actually removing the file
    if (fileToRemove.preview.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    const previousFiles = files; // Store the previous state reference

    return () => {
      previousFiles.forEach((file) => {
        if (file.preview.startsWith("blob:")) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  React.useEffect(() => {
    if (carouselApi && selectedImageIndex !== null) {
      carouselApi.scrollTo(selectedImageIndex);
    }
  }, [carouselApi, selectedImageIndex]);

  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  return (
    <>
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>Drag and drop your images or click the button below to select files.</CardDescription>
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
              id="file-upload"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <CloudUploadIcon className="h-16 w-16 text-zinc-500 dark:text-zinc-400" />
            <Button variant="outline" className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              Select Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedImageIndex(0)} className="text-sm">
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file, index) => (
                  <div
                    key={file.name + file.size} // More unique key
                    className="group relative aspect-square cursor-pointer"
                    onClick={() => file.type.startsWith("image/") && setSelectedImageIndex(index)}
                  >
                    {file.type.startsWith("image/") ? (
                      <Image
                        src={file.preview || "/placeholder.svg"}
                        alt={file.name}
                        fill
                        className="rounded-lg object-cover"
                      />
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
              {imageFiles.map((file, index) => (
                <CarouselItem key={file.name + file.size}>
                  <div className="relative aspect-[4/3] max-h-[600px] w-full">
                    <Image src={file.preview || "/placeholder.svg"} alt={file.name} fill className="object-contain" />
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
}

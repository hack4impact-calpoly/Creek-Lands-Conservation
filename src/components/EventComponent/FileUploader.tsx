"use client";

import type React from "react";
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import Image from "next/image";
import { CloudUploadIcon, FileIcon, X, ImageIcon, RefreshCw, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FileWithPreview extends File {
  preview: string;
}

interface S3Image {
  url: string;
  key: string;
  lastModified?: string;
}

export interface EnhancedImageSelectorHandle {
  uploadFiles: (eventId: string) => Promise<string[]>;
  getSelectedImages: () => string[];
  clear: () => void;
}

export interface EnhancedImageSelectorProps {
  resetFiles?: boolean;
  maxSelection?: number;
  eventId?: string;
}

const EnhancedImageSelector = forwardRef<EnhancedImageSelectorHandle, EnhancedImageSelectorProps>(
  ({ resetFiles, maxSelection = Number.POSITIVE_INFINITY, eventId }, ref) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [s3Images, setS3Images] = useState<S3Image[]>([]);
    const [totalImages, setTotalImages] = useState(0);
    const [selectedS3Images, setSelectedS3Images] = useState<S3Image[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [carouselApi, setCarouselApi] = useState<any>(null);
    const [isLoadingS3Images, setIsLoadingS3Images] = useState(false);
    const [activeTab, setActiveTab] = useState("upload");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [imagesPerPage, setImagesPerPage] = useState(8); // Default to 8
    const [paginatedS3Images, setPaginatedS3Images] = useState<S3Image[]>([]);
    // New state for previewing existing S3 images
    const [previewS3Image, setPreviewS3Image] = useState<S3Image | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const fetchS3Images = async (page = 1) => {
      setIsLoadingS3Images(true);
      try {
        const url = eventId
          ? `/api/s3/list-images?eventId=${eventId}&page=${page}&limit=${imagesPerPage}`
          : `/api/s3/list-images?page=${page}&limit=${imagesPerPage}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch images");
        const data = await response.json();
        console.log("S3 Images Response:", data);
        setS3Images(data.images || []);
        setPaginatedS3Images(data.images || []);
        setTotalPages(data.totalPages || 1);
        setTotalImages(data.total || 0);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching S3 images:", error);
        toast({
          title: "Error fetching images",
          description: "Could not load your previously uploaded images",
          variant: "destructive",
        });
      } finally {
        setIsLoadingS3Images(false);
      }
    };

    useEffect(() => {
      if (activeTab === "existing") {
        fetchS3Images(currentPage);
      }
    }, [activeTab, currentPage, imagesPerPage]);

    const uploadFile = async (file: File, eventId: string): Promise<string> => {
      if (!eventId) throw new Error("eventId is required for uploading event images");
      const presignedRes = await fetch(
        `/api/s3/presigned-event-images?fileName=${encodeURIComponent(file.name)}&mimetype=${file.type}&eventId=${eventId}`,
      );
      if (!presignedRes.ok) throw new Error("Failed to get presigned URL");
      const { uploadUrl, fileUrl } = await presignedRes.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      return fileUrl;
    };

    useImperativeHandle(ref, () => ({
      uploadFiles: async (eventId: string) => {
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        const uploadedUrls = await Promise.all(imageFiles.map((f) => uploadFile(f, eventId)));
        const allSelectedUrls = [...uploadedUrls, ...selectedS3Images.map((img) => img.url)];

        if (uploadedUrls.length > 0) {
          fetchS3Images(currentPage);
        }

        return allSelectedUrls;
      },
      getSelectedImages: () => {
        return selectedS3Images.map((img) => img.url);
      },
      clear: () => {
        files.forEach((file) => {
          if (file.preview.startsWith("blob:")) URL.revokeObjectURL(file.preview);
        });
        setFiles([]);
        setSelectedS3Images([]);
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
      const selected = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"));
      processFiles(selected);
      e.target.value = "";
    };

    const removeFile = (fileToRemove: FileWithPreview) => {
      setFiles((prev) => prev.filter((f) => f !== fileToRemove));
      if (fileToRemove.preview.startsWith("blob:")) URL.revokeObjectURL(fileToRemove.preview);
    };

    const toggleS3ImageSelection = (image: S3Image) => {
      if (selectedS3Images.some((img) => img.url === image.url)) {
        setSelectedS3Images((prev) => prev.filter((img) => img.url !== image.url));
      } else {
        if (selectedS3Images.length + files.length >= maxSelection) {
          toast({
            title: "Maximum selection reached",
            description: `You can only select up to ${maxSelection} images`,
            variant: "destructive",
          });
          return;
        }
        setSelectedS3Images((prev) => [...prev, image]);
      }
    };

    const handlePageChange = (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      setCurrentPage(page);
    };

    const handleImagesPerPageChange = (value: string) => {
      setImagesPerPage(Number(value));
      setCurrentPage(1); // Reset to first page when changing items per page
    };

    useEffect(() => {
      if (resetFiles) {
        files.forEach((file) => {
          if (file.preview.startsWith("blob:")) URL.revokeObjectURL(file.preview);
        });
        setFiles([]);
        setSelectedS3Images([]);
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
    const totalSelected = files.length + selectedS3Images.length;

    return (
      <>
        <Card className="mx-auto w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Image Selector</CardTitle>
            <CardDescription>Upload new images or select from your existing library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload New Images</TabsTrigger>
                <TabsTrigger value="existing">Select Existing Images</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 pt-4">
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
                    accept="image/*"
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
                      <h3 className="text-lg font-semibold">New Images ({files.length})</h3>
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
              </TabsContent>

              <TabsContent value="existing" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Image Library ({totalImages})</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchS3Images(currentPage)}
                      disabled={isLoadingS3Images}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoadingS3Images && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {isLoadingS3Images ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: imagesPerPage }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : paginatedS3Images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                    <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No images found in your library</p>
                    <p className="mt-1 text-xs text-muted-foreground">Upload some images to see them here</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {paginatedS3Images.map((image) => {
                        const isSelected = selectedS3Images.some((img) => img.url === image.url);
                        return (
                          <div
                            key={image.key}
                            className={cn(
                              "group relative aspect-square cursor-pointer rounded-lg overflow-hidden",
                              isSelected && "ring-2 ring-primary ring-offset-2",
                            )}
                            onClick={() => toggleS3ImageSelection(image)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setPreviewS3Image(image);
                            }}
                          >
                            <Image
                              src={image.url || "/placeholder.svg"}
                              alt={image.key.split("/").pop() || "Image"}
                              fill
                              className="object-cover transition-all group-hover:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                              <p className="truncate text-xs text-white">{image.key.split("/").pop()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 0 && (
                      <div className="mt-6 flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {paginatedS3Images.length} of {totalImages} images
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Images per page:</span>
                            <Select value={String(imagesPerPage)} onValueChange={handleImagesPerPageChange}>
                              <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder="8" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                                <SelectItem value="12">12</SelectItem>
                                <SelectItem value="16">16</SelectItem>
                                <SelectItem value="24">24</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => handlePageChange(currentPage - 1)}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>

                            {Array.from({ length: totalPages }).map((_, i) => {
                              const pageNumber = i + 1;
                              if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={pageNumber}>
                                    <PaginationLink
                                      onClick={() => handlePageChange(pageNumber)}
                                      isActive={currentPage === pageNumber}
                                    >
                                      {pageNumber}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                              if (
                                (pageNumber === 2 && currentPage > 3) ||
                                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                              ) {
                                return (
                                  <PaginationItem key={pageNumber}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}

                            <PaginationItem>
                              <PaginationNext
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={
                                  currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {totalSelected > 0
                ? `${totalSelected} image${totalSelected !== 1 ? "s" : ""} selected`
                : "No images selected"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setSelectedS3Images([]);
                }}
                disabled={totalSelected === 0}
              >
                Clear Selection
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Dialog for previewing new uploaded images */}
        <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
          <DialogContent className="p-4 sm:max-w-[800px] md:max-w-[900px]">
            <Carousel setApi={setCarouselApi}>
              <CarouselContent>
                {imageFiles.map((file) => (
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

        {/* New dialog for previewing existing S3 images */}
        <Dialog open={previewS3Image !== null} onOpenChange={(open) => !open && setPreviewS3Image(null)}>
          <DialogContent className="p-4 sm:max-w-[800px] md:max-w-[900px]">
            {previewS3Image && (
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-medium">{previewS3Image.key.split("/").pop() || "Image Preview"}</h3>
                <div className="relative aspect-[4/3] max-h-[600px] w-full">
                  <Image
                    src={previewS3Image.url || "/placeholder.svg"}
                    alt={previewS3Image.key.split("/").pop() || "Image"}
                    fill
                    className="rounded-md object-contain"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

EnhancedImageSelector.displayName = "EnhancedImageSelector";
export default EnhancedImageSelector;

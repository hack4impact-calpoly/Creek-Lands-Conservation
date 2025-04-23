"use client";

import type * as React from "react";
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { CloudUploadIcon, FileIcon, X, RefreshCw, Check, FileText } from "lucide-react";
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

export type PDFType = "template" | "completed";

interface FileWithPreview extends File {
  preview: string;
}

export interface PDFInfo {
  fileUrl: string;
  fileKey: string;
  fileName: string;
}

export interface S3PDF {
  url: string;
  key: string;
  name: string;
  lastModified?: string;
}

export interface EnhancedPDFSelectorProps {
  type: PDFType;
  onPDFsSelected: (pdfs: PDFInfo[]) => void;
  resetFiles?: boolean;
  maxSelection?: number;
}

export interface EnhancedPDFSelectorHandle {
  /** Uploads all staged PDFs to S3 and returns their info */
  uploadFiles: () => Promise<PDFInfo[]>;
  /** Gets info for all selected existing PDFs */
  getSelectedPDFs: () => PDFInfo[];
  /** Clears all staged PDFs (revoking previews) and selections */
  clear: () => void;
}

const EnhancedPDFSelector = forwardRef<EnhancedPDFSelectorHandle, EnhancedPDFSelectorProps>(
  ({ type, onPDFsSelected, resetFiles, maxSelection = Number.POSITIVE_INFINITY }, ref) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [s3PDFs, setS3PDFs] = useState<S3PDF[]>([]);
    const [totalPDFs, setTotalPDFs] = useState(0);
    const [selectedS3PDFs, setSelectedS3PDFs] = useState<S3PDF[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPdfIndex, setSelectedPdfIndex] = useState<number | null>(null);
    const [previewPdf, setPreviewPdf] = useState<string | null>(null);
    const [carouselApi, setCarouselApi] = useState<any>(null);
    const [isLoadingS3PDFs, setIsLoadingS3PDFs] = useState(false);
    const [activeTab, setActiveTab] = useState("upload");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pdfsPerPage, setPdfsPerPage] = useState(8);
    const [paginatedS3PDFs, setPaginatedS3PDFs] = useState<S3PDF[]>([]);

    const fetchS3PDFs = async (page = 1) => {
      setIsLoadingS3PDFs(true);
      try {
        const response = await fetch(`/api/s3-list-pdfs?page=${page}&limit=${pdfsPerPage}&type=${type}`);
        if (!response.ok) throw new Error("Failed to fetch PDFs");
        const data = await response.json();
        setS3PDFs(data.pdfs || []);
        setTotalPages(data.totalPages || 1);
        setTotalPDFs(data.totalPDFs || 0);
        setPaginatedS3PDFs(data.pdfs || []);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching S3 PDFs:", error);
        toast({
          title: "Error fetching PDFs",
          description: "Could not load your previously uploaded PDFs",
          variant: "destructive",
        });
      } finally {
        setIsLoadingS3PDFs(false);
      }
    };

    useEffect(() => {
      if (activeTab === "existing") {
        fetchS3PDFs(currentPage);
      }
    }, [currentPage, pdfsPerPage, activeTab, type]);

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
      if (files.length === 0 && selectedS3PDFs.length === 0) return [];

      // Upload new files
      const uploadedInfos = files.length > 0 ? await Promise.all(files.map(uploadPDF)) : [];

      // Convert selected existing PDFs to PDFInfo format
      const existingInfos = selectedS3PDFs.map((pdf) => ({
        fileUrl: pdf.url,
        fileKey: pdf.key,
        fileName: pdf.name,
      }));

      // Combine both
      const allInfos = [...uploadedInfos, ...existingInfos];

      onPDFsSelected(allInfos);

      if (uploadedInfos.length > 0) {
        toast({
          title: "PDFs processed successfully",
          description: `${uploadedInfos.length} PDFs uploaded and ${existingInfos.length} existing PDFs selected`,
          variant: "success",
        });

        // Refresh the list after upload
        fetchS3PDFs();
      } else if (existingInfos.length > 0) {
        toast({
          title: "PDFs selected successfully",
          description: `${existingInfos.length} existing PDFs selected`,
          variant: "success",
        });
      }

      return allInfos;
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      uploadFiles: handleUpload,
      getSelectedPDFs: () => {
        return selectedS3PDFs.map((pdf) => ({
          fileUrl: pdf.url,
          fileKey: pdf.key,
          fileName: pdf.name,
        }));
      },
      clear: () => {
        files.forEach((f) => {
          if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
        });
        setFiles([]);
        setSelectedS3PDFs([]);
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

    const toggleS3PDFSelection = (pdf: S3PDF) => {
      if (selectedS3PDFs.some((p) => p.url === pdf.url)) {
        setSelectedS3PDFs((prev) => prev.filter((p) => p.url !== pdf.url));
      } else {
        if (selectedS3PDFs.length + files.length >= maxSelection) {
          toast({
            title: "Maximum selection reached",
            description: `You can only select up to ${maxSelection} PDFs`,
            variant: "destructive",
          });
          return;
        }
        setSelectedS3PDFs((prev) => [...prev, pdf]);
      }
    };

    // Reset trigger
    useEffect(() => {
      if (resetFiles) {
        files.forEach((f) => {
          if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
        });
        setFiles([]);
        setSelectedS3PDFs([]);
      }
    }, [resetFiles]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        files.forEach((f) => {
          if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
        });
      };
    }, []);

    // Sync carousel scroll
    useEffect(() => {
      if (carouselApi && selectedPdfIndex !== null) {
        carouselApi.scrollTo(selectedPdfIndex);
      }
    }, [carouselApi, selectedPdfIndex]);

    const handlePageChange = (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      setCurrentPage(page);
    };

    const handlePDFsPerPageChange = (value: string) => {
      setPdfsPerPage(Number(value));
      setCurrentPage(1); // Reset to first page when changing items per page
    };

    const totalSelected = files.length + selectedS3PDFs.length;

    return (
      <>
        <Card className="mx-auto w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Waiver PDF Selector</CardTitle>
            <CardDescription>Upload new PDFs or select from your existing templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload New PDFs</TabsTrigger>
                <TabsTrigger value="existing">Select Existing PDFs</TabsTrigger>
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
                      <h3 className="text-lg font-semibold">New PDFs ({files.length})</h3>
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
                          <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-muted p-4">
                            <FileIcon className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-2 max-w-full truncate text-center text-xs text-muted-foreground">
                              {file.name}
                            </p>
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
              </TabsContent>

              <TabsContent value="existing" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your PDF Library ({totalPDFs})</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchS3PDFs()}
                    disabled={isLoadingS3PDFs}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoadingS3PDFs && "animate-spin")} />
                    Refresh
                  </Button>
                </div>

                {isLoadingS3PDFs ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: pdfsPerPage }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : paginatedS3PDFs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                    <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No PDFs found in your library</p>
                    <p className="mt-1 text-xs text-muted-foreground">Upload some PDFs to see them here</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {paginatedS3PDFs.map((pdf) => {
                        const isSelected = selectedS3PDFs.some((p) => p.url === pdf.url);
                        return (
                          <div
                            key={pdf.key}
                            className={cn(
                              "group relative aspect-square cursor-pointer rounded-lg overflow-hidden",
                              isSelected && "ring-2 ring-primary ring-offset-2",
                            )}
                            onClick={() => toggleS3PDFSelection(pdf)}
                          >
                            <div
                              className="flex h-full w-full flex-col items-center justify-center bg-muted p-4"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setPreviewPdf(pdf.url);
                              }}
                            >
                              <FileIcon className="h-10 w-10 text-muted-foreground" />
                              <p className="mt-2 max-w-full truncate text-center text-xs text-muted-foreground">
                                {pdf.name || pdf.key.split("/").pop()}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 0 && (
                      <div className="mt-6 flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {paginatedS3PDFs.length} of {totalPDFs} PDFs
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">PDFs per page:</span>
                            <Select value={String(pdfsPerPage)} onValueChange={handlePDFsPerPageChange}>
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

                              // Show first page, last page, current page, and pages around current
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

                              // Show ellipsis for gaps
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
                ? `${totalSelected} PDF${totalSelected !== 1 ? "s" : ""} selected`
                : "No PDFs selected"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  files.forEach((f) => {
                    if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
                  });
                  setFiles([]);
                  setSelectedS3PDFs([]);
                }}
                disabled={totalSelected === 0}
              >
                Clear Selection
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Preview dialog for new PDFs */}
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

        {/* Preview dialog for existing PDFs */}
        <Dialog open={previewPdf !== null} onOpenChange={(open) => !open && setPreviewPdf(null)}>
          <DialogContent className="h-[80vh] w-full max-w-[60vw] p-6">
            <div className="flex h-full w-full flex-col space-y-4">
              <p className="truncate text-sm font-medium">{previewPdf ? previewPdf.split("/").pop() : "PDF Preview"}</p>
              {previewPdf && (
                <iframe src={`${previewPdf}#toolbar=0`} className="h-[70vh] w-full rounded-lg" title="PDF Preview" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

EnhancedPDFSelector.displayName = "EnhancedPDFSelector";
export default EnhancedPDFSelector;

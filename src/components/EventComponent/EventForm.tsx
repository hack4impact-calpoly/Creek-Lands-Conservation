"use client";

import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { TooltipProvider } from "@/components/ui/tooltip";
import EnhancedImageSelector, { type EnhancedImageSelectorHandle } from "@/components/EventComponent/FileUploader";
import EnhancedPDFSelector, {
  type EnhancedPDFSelectorHandle,
  type PDFInfo,
} from "@/components/EventComponent/PDFUploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type EventFormData = {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  registrationDeadline: string;
  fee: number;
  images: string[];
};

export default function CreateEventForm() {
  const fileUploadRef = useRef<EnhancedImageSelectorHandle>(null);
  const pdfUploadRef = useRef<EnhancedPDFSelectorHandle>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSubmitting, setIsDraftSubmitting] = useState(false); // Separate state for draft
  const [resetUploader, setResetUploader] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      maxParticipants: 0,
      registrationDeadline: "",
      fee: 0,
      images: [],
    },
  });

  const onSubmit = async (data: EventFormData, isDraft: boolean) => {
    const setSubmitting = isDraft ? setIsDraftSubmitting : setIsSubmitting;
    setSubmitting(true);
    try {
      // Validate times
      const startISO = new Date(`${data.startDate}T${data.startTime}:00`).toISOString();
      const endISO = new Date(`${data.endDate}T${data.endTime}:00`).toISOString();
      const deadlineISO = new Date(data.registrationDeadline).toISOString();

      if (new Date(endISO) <= new Date(startISO)) {
        toast({
          title: "Unable to Create Event!",
          variant: "destructive",
          description: "End time must be after start time.",
        });
        return;
      }
      if (new Date(deadlineISO) >= new Date(startISO)) {
        toast({
          title: "Unable to Create Event!",
          variant: "destructive",
          description: "Registration deadline must be before start.",
        });
        return;
      }

      // Build payload
      const eventData = {
        title: data.title,
        description: data.description,
        startDate: startISO,
        endDate: endISO,
        location: data.location,
        capacity: Number(data.maxParticipants),
        registrationDeadline: deadlineISO,
        fee: Number(data.fee),
        isDraft,
      };

      // Send to backend
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error("Event Creation Failed");
      const createdEvent = await response.json();
      const eventId = createdEvent.id;

      const imageUrls = fileUploadRef.current ? await fileUploadRef.current.uploadFiles(eventId) : [];
      const pdfInfos = pdfUploadRef.current ? await pdfUploadRef.current.uploadFiles(eventId) : [];

      // Update the event with uploaded files
      const updateResponse = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imageUrls, waiverTemplates: pdfInfos }),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || "Failed to update event with files");
      }

      // On success
      reset({
        title: "",
        description: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        maxParticipants: 0,
        registrationDeadline: "",
        fee: 0,
        images: [],
      }); // Explicitly reset all fields
      setValue("description", ""); // Force clear Tiptap editor
      fileUploadRef.current?.clear();
      pdfUploadRef.current?.clear();
      setResetUploader(true);
      toast({
        title: "Success",
        description: isDraft ? "Event saved as draft." : "Event published successfully!",
        variant: "success",
      });
      if (!isDraft) setIsPublishDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || (isDraft ? "Failed to save draft." : "Failed to create event."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setResetUploader(false);
    }
  };

  return (
    <div>
      <div className="mx-auto mb-6 flex w-full max-w-6xl flex-wrap gap-4 p-2">
        <div className="min-w-[250px] flex-1">
          <EnhancedImageSelector ref={fileUploadRef} resetFiles={resetUploader} />
        </div>
        <div className="min-w-[250px] flex-1">
          <EnhancedPDFSelector
            type="template"
            ref={pdfUploadRef}
            onPDFsSelected={() => {}}
            resetFiles={resetUploader}
          />
        </div>
      </div>
      <form className="mx-auto max-w-6xl space-y-6 p-2">
        <h1 className="text-3xl font-medium">Basic Information</h1>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="title" className="block font-medium">
              Event Name
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter the event name"
              {...register("title", { required: "Event title is required" })}
              className="w-full rounded border p-2"
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="flex-1">
            <label htmlFor="location" className="block font-medium">
              Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="Enter the event location"
              {...register("location", { required: "Location is required" })}
              className="w-full rounded border p-2"
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="startDate" className="block font-medium">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              {...register("startDate", { required: "Start date is required" })}
              className="w-full rounded border p-2"
            />
            {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
          </div>
          <div>
            <label htmlFor="startTime" className="block font-medium">
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              {...register("startTime", { required: "Start time is required" })}
              className="w-full rounded border p-2"
            />
            {errors.startTime && <p className="text-sm text-red-500">{errors.startTime.message}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block font-medium">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              {...register("endDate", { required: "End date is required" })}
              className="w-full rounded border p-2"
            />
            {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
          </div>
          <div>
            <label htmlFor="endTime" className="block font-medium">
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              {...register("endTime", { required: "End time is required" })}
              className="w-full rounded border p-2"
            />
            {errors.endTime && <p className="text-sm text-red-500">{errors.endTime.message}</p>}
          </div>
        </div>

        <h1 className="text-3xl font-medium">Further Details</h1>
        <div>
          <label htmlFor="description" className="block font-medium">
            Event Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TooltipProvider>
                <MinimalTiptapEditor
                  className="w-full"
                  editorContentClassName="p-5"
                  output="html"
                  value={field.value}
                  onChange={field.onChange}
                />
              </TooltipProvider>
            )}
          />
        </div>

        <h1 className="text-3xl font-medium">Waivers and Registration</h1>
        <div>
          <label htmlFor="registrationDeadline" className="block font-medium">
            Registration Deadline
          </label>
          <input
            type="datetime-local"
            id="registrationDeadline"
            {...register("registrationDeadline", { required: "Registration deadline is required" })}
            className="w-full rounded border p-2"
          />
          {errors.registrationDeadline && <p className="text-sm text-red-500">{errors.registrationDeadline.message}</p>}
        </div>

        <div>
          <label htmlFor="maxParticipants" className="block font-medium">
            Maximum Participants
          </label>
          <input
            type="number"
            id="maxParticipants"
            placeholder="Enter max participants"
            {...register("maxParticipants", {
              required: "Maximum participants is required",
              min: { value: 1, message: "Must be at least 1" },
            })}
            className="w-full rounded border p-2"
          />
          {errors.maxParticipants && <p className="text-sm text-red-500">{errors.maxParticipants.message}</p>}
        </div>

        <h1 className="text-3xl font-medium">Payment</h1>
        <div>
          <label htmlFor="fee" className="block font-medium">
            Event Fee
          </label>
          <input
            type="number"
            id="fee"
            placeholder="Enter the event fee"
            {...register("fee", {
              required: "Event fee is required",
              min: { value: 0, message: "Fee cannot be negative" },
            })}
            className="w-full rounded border p-2"
          />
          {errors.fee && <p className="text-sm text-red-500">{errors.fee.message}</p>}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isSubmitting || isDraftSubmitting}
            className="rounded border bg-[#2b6cb0] px-4 py-2 text-white hover:bg-[#2b6cb0]/80 disabled:bg-gray-400"
          >
            Save Draft
          </button>
          <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isSubmitting || isDraftSubmitting}
                className="rounded border bg-[#558552] px-4 py-2 text-white hover:bg-[#6FAF68] disabled:bg-gray-400"
              >
                Publish Event
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to publish this event? It will be visible to users.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit((data) => onSubmit(data, false))}>Publish</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
            <div className="flex items-center space-x-4 rounded-lg bg-white p-6 shadow-lg">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-solid border-blue-500"></div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

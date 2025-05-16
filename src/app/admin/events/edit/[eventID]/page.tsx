"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { TooltipProvider } from "@/components/ui/tooltip";
import EnhancedImageSelector, { EnhancedImageSelectorHandle } from "@/components/EventComponent/FileUploader";
import EnhancedPDFSelector, { EnhancedPDFSelectorHandle } from "@/components/EventComponent/PDFUploader";
import BackButton from "@/components/ui/back-button";
import Link from "next/link";

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
  paymentNote: string;
  images: string[];
};

export default function EditEventPage({ params }: { params: { eventID: string } }) {
  const { eventID } = params;
  const router = useRouter();
  const { toast } = useToast();
  const fileUploadRef = useRef<EnhancedImageSelectorHandle>(null);
  const pdfUploadRef = useRef<EnhancedPDFSelectorHandle>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetUploader, setResetUploader] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventID}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();

        const toLocalDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA");
        const toLocalTime = (iso: string) =>
          new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const toLocalDateTime = (iso: string) => {
          const date = new Date(iso);
          return `${date.toLocaleDateString("en-CA")}T${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
        };

        reset({
          title: data.title,
          location: data.location,
          maxParticipants: data.capacity,
          fee: data.fee,
          description: data.description || "",
          startDate: toLocalDate(data.startDate),
          startTime: toLocalTime(data.startDate),
          endDate: toLocalDate(data.endDate),
          endTime: toLocalTime(data.endDate),
          registrationDeadline: toLocalDateTime(data.registrationDeadline),
          paymentNote: data.paymentNote || "",
          images: data.images || [],
        });
      } catch (error) {
        toast({ title: "Error", description: "Unable to load event data.", variant: "destructive" });
        router.push("/admin/events");
      } finally {
        setLoading(false);
      }
    };
    if (eventID) fetchEvent();
  }, [eventID, reset, toast, router]);

  const onSubmit = async (data: EventFormData, isDraft = false) => {
    setIsSubmitting(true);
    try {
      const startISO = new Date(`${data.startDate}T${data.startTime}:00`).toISOString();
      const endISO = new Date(`${data.endDate}T${data.endTime}:00`).toISOString();
      const deadlineISO = new Date(data.registrationDeadline).toISOString();

      if (new Date(endISO) <= new Date(startISO)) {
        toast({ title: "Error", description: "End time must be after start time.", variant: "destructive" });
        return;
      }
      if (new Date(deadlineISO) >= new Date(startISO)) {
        toast({ title: "Error", description: "Deadline must be before start.", variant: "destructive" });
        return;
      }

      const payload = {
        title: data.title,
        description: data.description,
        startDate: startISO,
        endDate: endISO,
        location: data.location,
        capacity: Number(data.maxParticipants),
        registrationDeadline: deadlineISO,
        fee: Number(data.fee),
        paymentNote: data.paymentNote,
        isDraft,
      };

      const res = await fetch(`/api/events/${eventID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update event");

      const imageUrls = fileUploadRef.current ? await fileUploadRef.current.uploadFiles(eventID) : [];
      const pdfInfos = pdfUploadRef.current ? await pdfUploadRef.current.uploadFiles(eventID) : [];

      await fetch(`/api/events/${eventID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imageUrls, waiverTemplates: pdfInfos }),
      });

      toast({ title: "Success", description: "Event updated successfully!", variant: "success" });
      router.push("/admin/events");
    } catch (error) {
      toast({ title: "Error", description: "Update failed.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setResetUploader(false);
    }
  };

  if (loading) return <div className="py-10 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/events" className="mb-4 inline-block">
        <BackButton />
      </Link>
      <h1 className="mb-6 text-center text-5xl font-medium">Edit Event</h1>

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

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="mx-auto max-w-6xl space-y-6 p-2">
        <h2 className="text-3xl font-medium">Basic Information</h2>
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

        <h2 className="text-3xl font-medium">Further Details</h2>
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

        <h2 className="text-3xl font-medium">Waivers and Registration</h2>
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
            {...register("maxParticipants", {
              required: "Maximum participants is required",
              min: { value: 1, message: "Must be at least 1" },
            })}
            className="w-full rounded border p-2"
          />
          {errors.maxParticipants && <p className="text-sm text-red-500">{errors.maxParticipants.message}</p>}
        </div>

        <h2 className="text-3xl font-medium">Payment</h2>
        <div>
          <label htmlFor="fee" className="block font-medium">
            Event Fee
          </label>
          <input
            type="number"
            id="fee"
            {...register("fee", {
              required: "Fee is required",
              min: { value: 0, message: "Fee cannot be negative" },
            })}
            className="w-full rounded border p-2"
          />
          {errors.fee && <p className="text-sm text-red-500">{errors.fee.message}</p>}
        </div>

        <div>
          <label htmlFor="paymentNote" className="block font-medium">
            Notes about Payment?
          </label>
          <Controller
            name="paymentNote"
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

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded border bg-[#558552] px-4 py-2 text-white hover:bg-[#6FAF68]"
          >
            Save Changes
          </button>
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

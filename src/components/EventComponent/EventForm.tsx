"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { TooltipProvider } from "@/components/ui/tooltip";

type EventFormData = {
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
};

type Content = string;

export default function CreateEventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descContent, setDescContent] = useState<Content>("");
  const [pNoteContent, setPNoteContent] = useState<Content>("");
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormData>();

  // Sync Tiptap content with react-hook-form
  useEffect(() => {
    setValue("description", descContent); // Update form field when editorContent changes
  }, [descContent, setValue]);

  // Sync Tiptap content with react-hook-form
  useEffect(() => {
    setValue("paymentNote", pNoteContent); // Update form field when editorContent changes
  }, [pNoteContent, setValue]);

  const onSubmit = async (data: EventFormData, isDraft: boolean) => {
    // Combine date and time into ISO 8601 format for MongoDB
    const startDateTime = new Date(`${data.startDate}T${data.startTime}:00`).toISOString();
    const endDateTime = new Date(`${data.endDate}T${data.endTime}:00`).toISOString();
    const registrationDeadline = new Date(data.registrationDeadline).toISOString();

    // Validate start and end times
    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast({
        title: "Unable to Create Event!",
        variant: "destructive",
        description: "End Time and Date Must Be After Start Time and Date!",
        duration: 5000,
      });
      return;
    }

    // Prepare data for MongoDB
    const eventData = {
      title: data.title,
      description: data.description,
      startDate: startDateTime,
      endDate: endDateTime,
      location: data.location,
      capacity: Number(data.maxParticipants),
      registrationDeadline: registrationDeadline,
      fee: Number(data.fee),
    };

    setIsSubmitting(true);
    console.log(data, isDraft ? "Saved as Draft" : "Published");

    // send post request if not draft
    if (!isDraft) {
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });

        if (response.ok) {
          setDescContent("");
          setPNoteContent("");
          setValue("description", "");
          setValue("paymentNote", "");
          reset();
          toast({
            title: "Event Created Successfully!",
            description: "Your Event Has Been Published!",
            variant: "success",
            duration: 5000,
          });
        } else {
          toast({
            title: "Event Creation Failed!",
            variant: "destructive",
            description: "An Error Occurred While Creating the Event.",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast({
          title: "Event Creation Failed!",
          variant: "destructive",
          description: "An Error Occurred While Creating the Event.",
          duration: 5000,
        });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-xl font-bold">Basic Information</h1>
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
            {...register("location")}
            className="w-full rounded border p-2"
          />
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

      <h1 className="text-xl font-bold">Further Details</h1>
      <div>
        <label htmlFor="description" className="block font-medium">
          Event Description
        </label>
        <TooltipProvider>
          <MinimalTiptapEditor
            value={descContent}
            onChange={setDescContent}
            className="w-full"
            editorContentClassName="p-5"
            output="html"
            placeholder="Provide a brief description of the event"
            autofocus={true}
            editable={true}
            editorClassName="focus:outline-none"
          />
        </TooltipProvider>

        <input name="description" id="description" type="hidden" {...register("description")} value={descContent} />
      </div>

      <h1 className="text-xl font-bold">Waivers and Registration</h1>
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

      <h1 className="text-xl font-bold">Payment</h1>
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

      <div>
        <label htmlFor="paymentNote" className="block font-medium">
          Notes About Payment?
        </label>
        <div id="paymentNote" aria-labelledby="paymentNote">
          <TooltipProvider>
            <MinimalTiptapEditor
              value={pNoteContent}
              onChange={setPNoteContent}
              className="w-full"
              editorContentClassName="p-5"
              output="html"
              placeholder="e.g. If you signed up for the overnight hiking/camping combo, the price is $10 for just the day trip and $20 for overnight. If there are multiple attendees, children under 15 are $10 and adults are $20."
              autofocus={true}
              editable={true}
              editorClassName="focus:outline-none"
            />
          </TooltipProvider>

          {/* <input name="paymentNote" id="paymentNote" type="hidden" {...register("description")} value={pNoteContent} /> */}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleSubmit((data) => onSubmit(data, true))}
          disabled={isSubmitting}
          className="rounded border bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded border bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Publish Event
        </button>
      </div>

      {/* loading indicator while submitting form */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="flex items-center space-x-4 rounded-lg bg-white p-6 shadow-lg">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-solid border-blue-500"></div>
            <p className="text-gray-800">Loading...</p>
          </div>
        </div>
      )}
    </form>
  );
}

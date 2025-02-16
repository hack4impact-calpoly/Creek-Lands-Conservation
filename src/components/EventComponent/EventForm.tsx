"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

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

export default function CreateEventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>();

  const onSubmit = async (data: EventFormData, isDraft: boolean) => {
    // start/end date validation
    const startDateTime = new Date(data.startDate + "T" + data.startTime);
    const endDateTime = new Date(data.endDate + "T" + data.endTime);
    if (endDateTime <= startDateTime) {
      toast({
        variant: "destructive",
        description: "End date/time must be after the start date/time.",
      });
      return;
    }

    // start loading
    setIsSubmitting(true);
    console.log(data, isDraft ? "Saved as Draft" : "Published");

    // send post request if not draft
    if (!isDraft) {
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data }),
        });

        if (response.ok) {
          const result = await response.json();
          setIsSuccess(true);
          reset(); // reset form after successful submission
        } else {
          toast({
            variant: "destructive",
            description: "Failed to create event.",
          });
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast({
          variant: "destructive",
          description: "An error occurred while creating the event.",
        });
      }
    }
    setIsSubmitting(false);
  };

  const closePopup = () => {
    setIsSuccess(false); // close the 'event created' popup
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
      <div>
        <label htmlFor="title" className="block font-medium">
          Event Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Enter the event title"
          {...register("title", { required: "Event title is required" })}
          className="w-full rounded border p-2"
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block font-medium">
          Event Description
        </label>
        <textarea
          id="description"
          placeholder="Provide a brief description of the event"
          {...register("description")}
          className="w-full rounded border p-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <div>
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

      {/* popup when event is created successfully */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-lg">
            <p className="text-lg font-semibold text-green-600">Event Created Successfully!</p>
            <button onClick={closePopup} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
              Close
            </button>
          </div>
        </div>
      )}

      {/* loading indicator while submitting form */}
      {isSubmitting && !isSuccess && (
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

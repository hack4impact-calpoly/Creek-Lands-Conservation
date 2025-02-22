"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IEvent, IEventUpdate } from "@/database/eventSchema";

interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  capacity: number;
  fee: number;
  description?: string;
  registrationDeadlineDate: string;
  registrationDeadlineTime: string;
}

const EditEventPage = () => {
  const router = useRouter();
  const { eventID } = useParams();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<EventFormData>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasEventStarted, setHasEventStarted] = useState(false);

  // Watch end date/time for registration deadline validation
  const endDate = watch("endDate");
  const endTime = watch("endTime");

  useEffect(() => {
    if (!eventID) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventID}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data: IEvent = await res.json();

        const eventStartDate = new Date(data.startDate);
        const now = new Date();
        setHasEventStarted(eventStartDate < now);

        // Set form values
        setValue("title", data.title);
        setValue("location", data.location);
        setValue("capacity", data.capacity);
        setValue("fee", data.fee);
        setValue("description", data.description || "");

        // Helper to split datetime into date/time fields
        const setDateTimeFields = (field: "start" | "end" | "registrationDeadline", date: Date) => {
          const isoDate = date.toISOString();
          setValue(`${field}Date`, isoDate.split("T")[0]);
          setValue(`${field}Time`, isoDate.split("T")[1].slice(0, 5));
        };

        setDateTimeFields("start", new Date(data.startDate));
        setDateTimeFields("end", new Date(data.endDate));
        setDateTimeFields("registrationDeadline", new Date(data.registrationDeadline));
      } catch (error) {
        toast({ title: "Error", description: "Failed to load event data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventID, setValue, toast]);

  const onSubmit = async (formData: EventFormData) => {
    try {
      // Combine date/time fields into Date objects
      const parseDateTime = (date: string, time: string): Date => {
        const [hours, minutes] = time.split(":").map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes);
        return newDate;
      };

      const startDateTime = parseDateTime(formData.startDate, formData.startTime);
      const endDateTime = parseDateTime(formData.endDate, formData.endTime);
      const registrationDeadline = parseDateTime(formData.registrationDeadlineDate, formData.registrationDeadlineTime);

      // Validation checks
      if (startDateTime >= endDateTime) {
        throw new Error("Event start must be before end time");
      }

      if (registrationDeadline > endDateTime) {
        throw new Error("Registration deadline cannot be after event end");
      }

      if (formData.capacity < 0) {
        throw new Error("Capacity must be non-negative");
      }

      // Prepare update payload
      const payload: IEventUpdate = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime,
        endDate: endDateTime,
        location: formData.location,
        capacity: formData.capacity,
        fee: formData.fee,
        registrationDeadline,
      };

      setSaving(true);
      const res = await fetch(`/api/events/${eventID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      toast({ title: "Success", description: "Event updated successfully!", variant: "success" });
      router.push(`/admin/events/${eventID}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update event", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /* cool little animation cuz why not */
  if (loading)
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="mx-auto h-8 w-1/2 rounded bg-gray-200"></div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 rounded bg-gray-100"></div>
          ))}
        </div>
      </div>
    );

  return (
    <Card className="mx-auto max-w-2xl rounded-lg p-4 shadow-lg sm:p-6">
      <CardContent>
        <h1 className="mb-4 text-center text-2xl font-bold sm:mb-6 sm:text-3xl">Edit Event</h1>

        {hasEventStarted && (
          <div className="mb-4 rounded bg-yellow-100 p-3 text-sm text-yellow-800 sm:text-base">
            Event has started - date, time, and capacity editing disabled
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Event Details Section */}
          <fieldset className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <legend className="mb-2 text-lg font-semibold md:col-span-2">Event Details</legend>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-sm sm:text-base" htmlFor="title">
                Event Title *
              </label>
              <Input
                id="title"
                className="text-sm sm:text-base"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && <p className="text-xs text-red-500 sm:text-sm">{errors.title.message}</p>}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-sm sm:text-base" htmlFor="location">
                Location *
              </label>
              <Input
                id="location"
                className="text-sm sm:text-base"
                {...register("location", { required: "Location is required" })}
              />
              {errors.location && <p className="text-xs text-red-500 sm:text-sm">{errors.location.message}</p>}
            </div>

            {/* Capacity */}
            <div className="space-y-1">
              <label className="text-sm sm:text-base" htmlFor="capacity">
                Capacity *
              </label>
              <Input
                id="capacity"
                type="number"
                className="text-sm sm:text-base"
                disabled={hasEventStarted}
                {...register("capacity", {
                  required: "Capacity is required",
                  min: { value: 0, message: "Must be non-negative" },
                  valueAsNumber: true,
                })}
              />
              {errors.capacity && <p className="text-xs text-red-500 sm:text-sm">{errors.capacity.message}</p>}
            </div>

            {/* Fee */}
            <div className="space-y-1">
              <label className="text-sm sm:text-base" htmlFor="fee">
                Fee ($) *
              </label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                className="text-sm sm:text-base"
                {...register("fee", {
                  required: "Fee is required",
                  min: { value: 0, message: "Must be non-negative" },
                  valueAsNumber: true,
                })}
              />
              {errors.fee && <p className="text-xs text-red-500 sm:text-sm">{errors.fee.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm sm:text-base" htmlFor="description">
                Description
              </label>
              <Textarea id="description" className="min-h-[100px] text-sm sm:text-base" {...register("description")} />
            </div>
          </fieldset>

          {/* Date & Time Section */}
          <fieldset className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <legend className="mb-2 text-lg font-semibold md:col-span-2">Date & Time</legend>

            {/* Start Date/Time */}
            <div className="space-y-1">
              <label className="text-sm sm:text-base">Start Date/Time *</label>
              <div className="flex flex-row gap-2">
                <Input
                  id="startDate"
                  type="date"
                  className="flex-1 text-sm sm:text-base"
                  disabled={hasEventStarted}
                  {...register("startDate", { required: "Start date is required" })}
                />
                <Input
                  id="startTime"
                  type="time"
                  className="flex-1 text-sm sm:text-base"
                  disabled={hasEventStarted}
                  {...register("startTime", { required: "Start time is required" })}
                />
              </div>
              {errors.startDate && <p className="text-xs text-red-500 sm:text-sm">{errors.startDate.message}</p>}
              {errors.startTime && <p className="text-xs text-red-500 sm:text-sm">{errors.startTime.message}</p>}
            </div>

            {/* End Date/Time */}
            <div className="space-y-1">
              <label className="text-sm sm:text-base">End Date/Time *</label>
              <div className="flex flex-row gap-2">
                <Input
                  id="endDate"
                  type="date"
                  className="flex-1 text-sm sm:text-base"
                  disabled={hasEventStarted}
                  {...register("endDate", { required: "End date is required" })}
                />
                <Input
                  id="endTime"
                  type="time"
                  className="flex-1 text-sm sm:text-base"
                  disabled={hasEventStarted}
                  {...register("endTime", { required: "End time is required" })}
                />
              </div>
              {errors.endDate && <p className="text-xs text-red-500 sm:text-sm">{errors.endDate.message}</p>}
              {errors.endTime && <p className="text-xs text-red-500 sm:text-sm">{errors.endTime.message}</p>}
            </div>

            {/* Registration Deadline */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm sm:text-base">Registration Deadline *</label>
              <div className="flex flex-row gap-2">
                <Input
                  id="registrationDeadlineDate"
                  type="date"
                  className="flex-1 text-sm sm:text-base"
                  min={new Date().toISOString().split("T")[0]}
                  {...register("registrationDeadlineDate", {
                    required: "Deadline date is required",
                    validate: (value) => {
                      if (!endDate || !endTime) return true;
                      const deadlineDate = new Date(value + "T" + watch("registrationDeadlineTime"));
                      const endDateObj = new Date(endDate + "T" + endTime);
                      return deadlineDate <= endDateObj || "Cannot be after event end";
                    },
                  })}
                />
                <Input
                  id="registrationDeadlineTime"
                  type="time"
                  className="flex-1 text-sm sm:text-base"
                  {...register("registrationDeadlineTime", { required: "Deadline time is required" })}
                />
              </div>
              {errors.registrationDeadlineDate && (
                <p className="text-xs text-red-500 sm:text-sm">{errors.registrationDeadlineDate.message}</p>
              )}
              {errors.registrationDeadlineTime && (
                <p className="text-xs text-red-500 sm:text-sm">{errors.registrationDeadlineTime.message}</p>
              )}
            </div>
          </fieldset>

          {/* Form Actions */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditEventPage;

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { IEventUpdate } from "@/database/eventSchema";
import { FormField } from "@/components/Forms/FormField";
import { DateTimeField } from "@/components/Forms/DateTimeField";
import { FormActions } from "@/components/Forms/FormActions";
import { parseDateTime } from "@/lib/utils";
import Link from "next/link";
import { EventFormData } from "@/types/events";
import { validateEventDates } from "@/lib/utils";
import LoadingSkeleton from "@/components/Forms/LoadingSkeleton";

const EditEventPage = () => {
  const router = useRouter();
  const { eventID } = useParams();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasEventStarted, setHasEventStarted] = useState(false);

  useEffect(() => {
    if (!eventID) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventID}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();

        setValue("title", data.title);
        setValue("location", data.location);
        setValue("capacity", data.capacity);
        setValue("fee", data.fee);
        setValue("description", data.description || "");

        // Set date/time fields in local time
        const setDateTimeFields = (field: "start" | "end" | "registrationDeadline", date: Date) => {
          /* needs YYYY-MM-DD format... this vexes me */
          setValue(`${field}Date`, date.toLocaleDateString("en-CA"));
          /* needs 24 hour format... praise be to Great Britain */
          setValue(`${field}Time`, date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
        };

        setDateTimeFields("start", new Date(data.startDate));
        setDateTimeFields("end", new Date(data.endDate));
        setDateTimeFields("registrationDeadline", new Date(data.registrationDeadline));

        // Check if event has started or ended using local time
        const now = new Date();
        const eventEnd = new Date(data.endDate);
        setHasEventStarted(new Date(data.startDate) < now);

        if (eventEnd < now) {
          toast({ title: "Error", description: "This event has ended and cannot be edited.", variant: "destructive" });
          router.push("/admin/events");
          return;
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load event data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventID, setValue, toast, router]);

  const onSubmit = async (formData: EventFormData) => {
    try {
      const startDateTime = parseDateTime(formData.startDate, formData.startTime);
      const endDateTime = parseDateTime(formData.endDate, formData.endTime);
      const registrationDeadline = parseDateTime(formData.registrationDeadlineDate, formData.registrationDeadlineTime);

      // Validation checks
      const dateErrors = validateEventDates(startDateTime, endDateTime, registrationDeadline);
      if (dateErrors) {
        throw new Error(dateErrors);
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
      router.push("/admin/events");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update event", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  /* cool little animation cuz why not */
  if (loading) return <LoadingSkeleton />;

  return (
    <div>
      <Link href="/admin/events" className="mb-4 inline-block text-blue-600 hover:text-blue-800">
        ← Back to Admin
      </Link>
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

              <FormField label="Event Title *" name="title" register={register} error={errors.title} />

              <FormField label="Location *" name="location" register={register} error={errors.location} />

              <FormField
                label="Capacity *"
                name="capacity"
                type="number"
                register={register}
                error={errors.capacity}
                disabled={hasEventStarted}
                min={0}
              />

              <FormField
                label="Fee ($) *"
                name="fee"
                type="number"
                step="0.01"
                register={register}
                error={errors.fee}
                min={0}
              />

              <FormField
                label="Description"
                name="description"
                type="textarea"
                register={register}
                className="md:col-span-2"
              />
            </fieldset>

            {/* Date & Time Section */}
            <fieldset className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <legend className="mb-2 text-lg font-semibold md:col-span-2">Date & Time</legend>

              <DateTimeField
                label="Start Date/Time *"
                dateName="startDate"
                timeName="startTime"
                register={register}
                errors={{ date: errors.startDate, time: errors.startTime }}
                disabled={hasEventStarted}
              />

              <DateTimeField
                label="End Date/Time *"
                dateName="endDate"
                timeName="endTime"
                register={register}
                errors={{ date: errors.endDate, time: errors.endTime }}
                disabled={hasEventStarted}
              />

              {/* Registration Deadline - (this one is wider) */}
              <div className="space-y-1 md:col-span-2">
                <DateTimeField
                  label="Registration Deadline *"
                  dateName="registrationDeadlineDate"
                  timeName="registrationDeadlineTime"
                  register={register}
                  errors={{ date: errors.registrationDeadlineDate, time: errors.registrationDeadlineTime }}
                />
              </div>
            </fieldset>

            <FormActions
              onSecondary={() => {
                if (window.history.length > 1) router.back();
                else router.push("/admin/events");
              }}
              isSubmitting={saving}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditEventPage;

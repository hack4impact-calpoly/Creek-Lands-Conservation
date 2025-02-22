"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useForm } from "react-hook-form";

// Define the structure for form data
interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  capacity: number;
  fees: number;
  description?: string;
  registrationDeadline: string;
}

interface EventData extends EventFormData {}

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
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventID) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventID}`);
        if (!res.ok) throw new Error("Failed to fetch event");
        const data: EventData = await res.json();
        setEventData(data);
        setValue("title", data.title);
        setValue("startDate", data.startDate.split("T")[0]);
        setValue("startTime", data.startDate.split("T")[1]?.slice(0, 5));
        setValue("endDate", data.endDate.split("T")[0]);
        setValue("endTime", data.endDate.split("T")[1]?.slice(0, 5));
        setValue("location", data.location);
        setValue("capacity", data.capacity);
        setValue("fees", data.fees);
        setValue("description", data.description || "");
        setValue("registrationDeadline", data.registrationDeadline.split("T")[0]);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Error loading event data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventID, setValue]);

  const onSubmit = async (data: EventFormData) => {
    if (!eventData) {
      toast({ title: "Error", description: "Event not found", variant: "destructive" });
      return;
    }

    if (new Date(data.startDate) > new Date(data.endDate)) {
      toast({ title: "Warning", description: "Start date must be before end date", variant: "destructive" });
      return;
    }
    if (data.capacity < 0) {
      toast({ title: "Warning", description: "Capacity must be non-negative", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          startDate: `${data.startDate}T${data.startTime}:00Z`,
          endDate: `${data.endDate}T${data.endTime}:00Z`,
          location: data.location,
          capacity: data.capacity,
          fee: data.fees,
          description: data.description,
          registrationDeadline: `${data.registrationDeadline}T23:59:59Z`,
        }),
      });

      if (!res.ok) throw new Error("Failed to update event");
      toast({ title: "Success", description: "Event updated successfully!", variant: "success" });
      router.push(`/admin/events/${eventID}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Error updating event", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading event data...</p>;
  if (!eventData) return <p>Event not found</p>;

  return (
    <div className="container mx-auto p-6">
      <Link href="/admin">
        <button className="rounded bg-gray-500 px-4 py-2 text-white">Back</button>
      </Link>
      <h1 className="my-4 text-2xl font-bold">Edit Event</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="text" {...register("title", { required: true })} className="input" placeholder="Event Title" />
        <textarea {...register("description")} className="input" placeholder="Event Description" />
        <input type="date" {...register("startDate", { required: true })} className="input" />
        <input type="time" {...register("startTime", { required: true })} className="input" />
        <input type="date" {...register("endDate", { required: true })} className="input" />
        <input type="time" {...register("endTime", { required: true })} className="input" />
        <input type="text" {...register("location", { required: true })} className="input" placeholder="Location" />
        <input
          type="number"
          {...register("capacity", { required: true, min: 0 })}
          className="input"
          placeholder="Capacity"
        />
        <input type="number" {...register("fees", { required: true })} className="input" placeholder="Fees" />
        <input type="date" {...register("registrationDeadline", { required: true })} className="input" />
        <button type="submit" disabled={saving} className="rounded bg-blue-500 px-4 py-2 text-white">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditEventPage;

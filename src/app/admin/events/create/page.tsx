import CreateEventForm from "@/components/EventComponent/EventForm";
import Link from "next/link";
import BackButton from "@/components/ui/back-button";

export default function CreateEventPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/events" className="mb-4 inline-block">
        <BackButton />
      </Link>
      <h1 className="mb-6 text-center text-5xl font-medium">Create Event</h1>
      <CreateEventForm />
    </div>
  );
}

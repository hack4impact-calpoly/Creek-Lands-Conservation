import CreateEventForm from "@/components/EventComponent/EventForm";
import Link from "next/link";

export default function CreateEventPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/events" className="mb-4 inline-block text-blue-600 hover:text-blue-800">
        ← Back to Admin
      </Link>
      <h1 className="mb-6 text-center text-2xl font-bold">Create Event</h1>
      <CreateEventForm />
    </div>
  );
}

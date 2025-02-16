import CreateEventForm from "../../../components/EventComponent/EventForm";

export default function CreateEventPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create Event</h1>
      <CreateEventForm />
    </div>
  );
}

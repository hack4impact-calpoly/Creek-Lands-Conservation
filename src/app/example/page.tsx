import EventCard from "@/components/EventComponent/EventCard";

export default function Page() {
  return (
    <div className="container">
      <div>This is an example page using App Router!</div>
      <div className="p-4">
        <EventCard
          title="SLO Wild Hike: Stenner Creek"
          date="Saturday 4/6/25"
          time="10–12pm"
          onMoreInfo="More info about Stenner Creek hike"
        />
      </div>
    </div>
  );
}

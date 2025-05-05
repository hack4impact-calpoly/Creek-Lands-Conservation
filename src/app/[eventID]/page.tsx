"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { APIEvent, LimitedEventInfo } from "@/types/events";
import EventRegister from "@/components/EventComponent/EventRegister";
import { IUserData } from "@/types/user";
import { useUser } from "@clerk/nextjs";
import { getEvents } from "@/app/actions/events/actions";
import { Button } from "@/components/ui/button";
import WaiverSignatureForm from "@/components/WaiverSignatureComponent/WaiverSignatureForm";

export interface Attendee {
  firstName: string;
  lastName: string;
  userID: string;
  isChild: boolean;
}

const RegisterPage = () => {
  const { eventID } = useParams();
  const { isLoaded, user } = useUser();
  const [event, setEvent] = useState<APIEvent | null>(null);
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<Attendee[]>([]);
  const [registrationStage, setRegistrationState] = useState<"selectParticipants" | "signWaivers" | "payment">(
    "selectParticipants",
  );
  const [userInfo, setUserInfo] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    alreadyRegistered: boolean;
    family: { id: string; firstName: string; lastName: string; alreadyRegistered: boolean }[];
  }>({
    id: "",
    firstName: "",
    lastName: "",
    alreadyRegistered: false,
    family: [],
  });

  useEffect(() => {
    const fetchEventandUser = async () => {
      if (!isLoaded) return;
      try {
        const eventRes = await fetch(`/api/events/${eventID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!eventRes.ok) {
          throw new Error("Failed to fetch event data");
        }

        const eventData = await eventRes.json();
        setEvent(eventData);

        if (user) {
          const userResponse = await fetch(`/api/users/${user.id}`);
          if (!userResponse.ok) throw new Error("Failed to fetch user data");

          const fetchedUserData: IUserData = await userResponse.json();
          if (!fetchedUserData?._id) throw new Error("User not found in MongoDB");

          setUserData(fetchedUserData);

          const family =
            fetchedUserData.children?.map((child: any) => ({
              id: child._id,
              firstName: child.firstName || "",
              lastName: child.lastName || "",
              alreadyRegistered: child.registeredEvents.includes(eventData.id),
            })) || [];

          setUserInfo({
            id: fetchedUserData._id,
            firstName: fetchedUserData.firstName || "",
            lastName: fetchedUserData.lastName || "",
            alreadyRegistered:
              eventData.registeredUsers.some((user: { user: string }) => user.user === fetchedUserData._id) || false,
            family,
          });

          console.log("User Info:", event?.registeredUsers);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };
    fetchEventandUser();
  }, [isLoaded, user]);

  const handleSelectSubmit = async () => {
    setRegistrationState("signWaivers");
    console.log("Selected Attendees:", selectedAttendees);
  };

  return (
    <div>
      {event && registrationStage === "selectParticipants" && (
        <>
          <EventRegister
            title={event.title}
            description={event.description ? event.description : ""}
            startDate={event.startDate}
            endDate={event.endDate}
            location={event.location}
            capacity={event.capacity}
            registrationDeadline={event.registrationDeadline}
            images={event.images}
            registeredUsers={event.registeredUsers}
            registeredChildren={event.registeredChildren}
            userInfo={userInfo}
            selectedAttendees={selectedAttendees}
            setSelectedAttendees={setSelectedAttendees}
          />
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleSelectSubmit}
              className="bg-[#488644] text-white hover:bg-[#3a6d37]"
              disabled={selectedAttendees.length === 0}
            >
              {selectedAttendees.length > 0 ? "Proceed to Waiver" : "Select Participants"}
            </Button>
          </div>
        </>
      )}
      {event && registrationStage === "signWaivers" && (
        <>
          <WaiverSignatureForm
            eventId={event.id}
            participants={selectedAttendees}
            onAllSigned={() => console.log("redirecting...")}
          />
          {/* <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleSelectSubmit}
              className="bg-[#488644] text-white hover:bg-[#3a6d37]"
              disabled={selectedAttendees.length === 0}
            >
              {selectedAttendees.length > 0 ? "Proceed to Waiver" : "Select Participants"}
            </Button>
          </div> */}
        </>
      )}
    </div>
  );
};

export default RegisterPage;

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { APIEvent } from "@/types/events";
import EventRegister from "@/components/EventComponent/EventRegister";
import { IUserData } from "@/types/user";
import { useUser } from "@clerk/nextjs";

const RegisterPage = () => {
  const { eventID } = useParams();
  const { isLoaded, user } = useUser();
  const [event, setEvent] = useState<APIEvent | null>(null);
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationStage, setRegistrationState] = useState<"selectParticipants" | "signWaivers" | "payment">(
    "selectParticipants",
  );
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch event data");
        }

        const eventData = await response.json();
        setEvent(eventData);
        console.log(eventData);
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };

    const fetchUserData = async () => {
      if (!isLoaded) return;
      try {
        if (user) {
          const userResponse = await fetch(`/api/users/${user.id}`);
          if (!userResponse.ok) throw new Error("Failed to fetch user data");

          const fetchedUserData: IUserData = await userResponse.json();
          if (!fetchedUserData?._id) throw new Error("User not found in MongoDB");

          setUserData(fetchedUserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchEvent();
    fetchUserData();
  }, [isLoaded, user]);

  return (
    <div>
      {event && registrationStage === "selectParticipants" && (
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
        />
      )}
    </div>
  );
};

export default RegisterPage;

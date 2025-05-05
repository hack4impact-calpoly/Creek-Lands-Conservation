"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock1, Clock5, MapPin, Mail, CalendarClock, Users, ImageIcon, Text } from "lucide-react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { APIEvent, RegisteredChildInfo, RegisteredUserInfo } from "@/types/events";
import { IChildData, IUserData } from "@/types/user";
import Image from "next/image";
import DOMPurify from "dompurify";

interface EventRegisterProps {
  // event props
  title: string;
  description: string | "";
  startDate: string | null;
  endDate: string | null;
  location: string;
  capacity: number;
  registrationDeadline: string | null;
  images: string[];
  registeredUsers: RegisteredUserInfo[];
  registeredChildren: RegisteredChildInfo[];
  // user props
  userInfo: {
    id: string;
    name: string;
    alreadyRegistered: boolean;
    family: { id: string; name: string; alreadyRegistered: boolean }[];
  };
}

const EventRegister = ({
  // event props
  title,
  description = "",
  startDate,
  endDate,
  location,
  capacity,
  registrationDeadline,
  images,
  registeredUsers,
  registeredChildren,
  // user props
  userInfo,
  // registeredEvents,
}: EventRegisterProps) => {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [waiverEmail, setWaiverEmail] = useState("");
  const [waiverSigned, setWaiverSigned] = useState(false);
  const sanitizedDescription = DOMPurify.sanitize(description);
  const currentRegistrations = registeredUsers.length + registeredChildren.length;
  const remainingCapacity = capacity - currentRegistrations;

  return (
    <>
      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-4xl">
          <h1 className="mb-6 text-center text-4xl">{title}</h1>

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm text-black sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Clock1 />
              {startDate
                ? new Date(startDate)
                    .toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(",", " -")
                : "TBD"}
            </div>
            <div className="flex items-center gap-2">
              <Clock5 />
              {endDate
                ? new Date(endDate)
                    .toLocaleString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(",", " -")
                : "TBD"}
            </div>

            <div className="flex items-center gap-2">
              <MapPin />
              {location}
            </div>
            <div className="flex items-center gap-2">
              <Mail />
              <span>marysia@creeklands.org</span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarClock />
              <span>
                Deadline:{" "}
                {registrationDeadline
                  ? new Date(registrationDeadline)
                      .toLocaleString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                      .replace(",", " -")
                  : "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users />
              {currentRegistrations} / {capacity} spots filled
            </div>

            <div className="col-span-full">
              <div className="mb-2 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <span>Event Images</span>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto py-4">
                {images.map((src, index) => (
                  <div key={index} className="flex-shrink-0">
                    <Image
                      src={src}
                      alt={`Event Image ${index + 1}`}
                      width={256}
                      height={180}
                      className="h-auto w-64 rounded-lg object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full">
              <Text className="h-5 w-5" />
              <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
            </div>
          </div>

          <div className="w-full">
            <h2 className="text 3xl mb-4">Who&apos;s attending?</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={userInfo.id}
                  checked={selectedAttendees.includes(userInfo.id) || userInfo.alreadyRegistered}
                  onCheckedChange={(checked) => {
                    setSelectedAttendees((prev) =>
                      checked ? [...prev, userInfo.id] : prev.filter((id) => id !== userInfo.id),
                    );
                  }}
                  disabled={
                    userInfo.alreadyRegistered ||
                    (!selectedAttendees.includes(userInfo.id) && selectedAttendees.length >= remainingCapacity)
                  }
                />
                <label
                  htmlFor={userInfo.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {userInfo.name}
                  {(userInfo.alreadyRegistered ||
                    (!selectedAttendees.includes(userInfo.id) && selectedAttendees.length >= remainingCapacity)) && (
                    <span className="ml-2 text-xs italic text-gray-500">
                      {userInfo.alreadyRegistered ? "(Already registered)" : " (Capacity full)"}
                    </span>
                  )}
                </label>
              </div>
              {userInfo.family.map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={member.id}
                    checked={selectedAttendees.includes(member.id) || member.alreadyRegistered}
                    onCheckedChange={(checked) => {
                      setSelectedAttendees((prev) =>
                        checked ? [...prev, member.id] : prev.filter((id) => id !== member.id),
                      );
                    }}
                    disabled={
                      member.alreadyRegistered ||
                      (!selectedAttendees.includes(member.id) && selectedAttendees.length >= remainingCapacity)
                    }
                  />
                  <label
                    htmlFor={member.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {member.name}
                    <span className="ml-2 text-xs italic text-gray-500">
                      {(member.alreadyRegistered ||
                        (!selectedAttendees.includes(member.id) && selectedAttendees.length >= remainingCapacity)) && (
                        <span className="ml-2 text-xs italic text-gray-500">
                          {member.alreadyRegistered ? "(Already registered)" : " (Capacity full)"}
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventRegister;

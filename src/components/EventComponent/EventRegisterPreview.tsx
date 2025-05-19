"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Mail, Check, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface RegisterDialogProps {
  isOpen: boolean;
  capacityLeft: number;
  onOpenChange: (open: boolean) => void;
  eventInfo: {
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    contactEmail: string;
  };
  userInfo: {
    id: string;
    name: string;
    alreadyRegistered: boolean;
    family: { id: string; name: string; alreadyRegistered: boolean }[];
  };
  onConfirm: (attendees: string[]) => void;
}

export function EventRegisterPreview({
  isOpen,
  capacityLeft,
  onOpenChange,
  eventInfo,
  userInfo,
  onConfirm,
}: RegisterDialogProps) {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [waiverEmail, setWaiverEmail] = useState("");
  const [waiverSigned, setWaiverSigned] = useState(false);
  const remainingCapacity = capacityLeft;
  const { toast } = useToast();

  const allRegistered = userInfo.alreadyRegistered && userInfo.family.every((member) => member.alreadyRegistered);

  const handleClick = () => {
    if (selectedAttendees.length > 0) {
      onConfirm(selectedAttendees);
    } else {
      toast({
        title: "No Attendees Selected",
        description: "Please select at least one attendee to register.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedAttendees([]);
      setWaiverEmail("");
      setWaiverSigned(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-[70vh] w-full max-w-[80%] overflow-y-auto rounded-lg md:max-w-[700px] lg:max-w-[900px]">
        <DialogHeader className="items-center">
          <div className="mb-2 flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold sm:text-3xl">Register for: {eventInfo.title}</DialogTitle>
          </div>

          <div className="flex flex-col gap-2 text-xs text-gray-600 sm:flex-row sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {eventInfo.startDate} - {eventInfo.endDate}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {eventInfo.startTime} - {eventInfo.endTime}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {eventInfo.location}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {eventInfo.contactEmail}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="w-full">
            <h3 className="mb-4 font-semibold">Who&apos;s attending?</h3>
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

          <div>
            <h3 className="mb-4 font-semibold">Waiver</h3>
            <p className="mb-4 text-sm text-gray-600">
              To attend this event, please sign this waiver first. You can sign it digitally or print, sign, and upload
              it.
            </p>

            <div className="space-y-4">
              <Button variant="secondary" className="w-full" onClick={() => window.open("/waiver.pdf", "_blank")}>
                <Download className="mr-2 h-4 w-4" />
                Download Waiver
              </Button>

              <div className="text-center text-sm text-gray-600">or</div>

              <div>
                <label className="text-sm text-gray-600">Send waiver to this email (for printing)</label>
                <Input
                  placeholder="e.g. jameshudson345@gmail.com"
                  value={waiverEmail}
                  onChange={(e) => setWaiverEmail(e.target.value)}
                  className="mt-1 w-full"
                />
              </div>

              {waiverSigned ? (
                <Button variant="outline" className="w-full bg-[#488644] text-white hover:bg-[#3a6d37]">
                  <Check className="mr-2 h-4 w-4" />
                  Signed on {new Date().toLocaleDateString()}
                  <span className="ml-2 text-sm">Click here to view</span>
                </Button>
              ) : (
                <Button className="w-full bg-[#488644] text-white hover:bg-[#3a6d37]">Click here to sign waiver</Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          {!waiverSigned && (
            <Button
              className="mx-auto w-full bg-[#488644] text-white hover:bg-[#3a6d37] sm:w-2/5"
              onClick={handleClick}
              disabled={allRegistered}
            >
              {allRegistered ? "All Family Members Registered" : "Register for Event"}
            </Button>
          )}
          {waiverSigned && (
            <Button
              className="mx-auto w-full bg-[#488644] text-white hover:bg-[#3a6d37] sm:w-2/5"
              onClick={handleClick}
              disabled={allRegistered}
            >
              {allRegistered ? "All Family Members Registered" : "Sign and Return to Events"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

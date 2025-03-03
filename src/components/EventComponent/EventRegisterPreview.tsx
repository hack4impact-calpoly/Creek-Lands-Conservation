"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Mail, Check, Download } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface RegisterDialogProps {
  isOpen: boolean;
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
    name: string;
    family: { name: string }[];
  };
  onConfirm: () => void;
}

export function EventRegisterPreview({ isOpen, onOpenChange, eventInfo, userInfo, onConfirm }: RegisterDialogProps) {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [waiverEmail, setWaiverEmail] = useState("");
  const [waiverSigned, setWaiverSigned] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[75vw] min-w-[900px] p-8">
        <DialogHeader className="items-center">
          <div className="mb-2 flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold">Register for: {eventInfo.title}</DialogTitle>
          </div>

          <div className="flex gap-6 text-sm text-gray-600">
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

        <div className="mt-2 grid grid-cols-2 gap-12">
          <div className="w-full">
            <h3 className="mb-4 font-semibold">Who&apos;s attending?</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={userInfo.name}
                  checked={selectedAttendees.includes(userInfo.name)}
                  onCheckedChange={(checked) => {
                    setSelectedAttendees((prev) =>
                      checked ? [...prev, userInfo.name] : prev.filter((name) => name !== userInfo.name),
                    );
                  }}
                />
                <label
                  htmlFor={userInfo.name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {userInfo.name}
                </label>
              </div>
              {userInfo.family.map((member) => (
                <div key={member.name} className="flex items-center space-x-3">
                  <Checkbox
                    id={member.name}
                    checked={selectedAttendees.includes(member.name)}
                    onCheckedChange={(checked) => {
                      setSelectedAttendees((prev) =>
                        checked ? [...prev, member.name] : prev.filter((name) => name !== member.name),
                      );
                    }}
                  />
                  <label
                    htmlFor={member.name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {member.name}
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
                  className="mt-1"
                />
              </div>

              {waiverSigned ? (
                <Button variant="outline" className="w-full bg-green-500 text-white hover:bg-green-600">
                  <Check className="mr-2 h-4 w-4" />
                  Signed on {/* Add date here */}
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
            <Button className="mx-auto w-2/5 bg-[#488644] text-white hover:bg-[#3a6d37]" onClick={onConfirm}>
              Register for Event
            </Button>
          )}
          {waiverSigned && (
            <Button className="mx-auto w-2/5 bg-[#488644] text-white hover:bg-[#3a6d37]" onClick={onConfirm}>
              Sign and return to calendar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

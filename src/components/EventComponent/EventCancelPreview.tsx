"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { useState } from "react";

interface CancelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventInfo: {
    title: string;
  };
  userInfo: {
    id: string;
    name: string;
    alreadyRegistered: boolean;
    family: { id: string; name: string; alreadyRegistered: boolean }[];
  };
  onConfirm: (attendees: string[]) => void;
}

export function EventCancelPreview({ isOpen, onOpenChange, eventInfo, userInfo, onConfirm }: CancelDialogProps) {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  const handleClick = () => {
    if (selectedAttendees.length > 0) {
      onConfirm(selectedAttendees);
    }
  };

  const getSelectedNames = () => {
    const names = selectedAttendees.map((id) => {
      if (id === userInfo.id) return userInfo.name;
      const familyMember = userInfo.family.find((member) => member.id === id);
      return familyMember?.name || "";
    });
    return names.join(", ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="relative w-full max-w-[500px] rounded-lg bg-white p-6">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-semibold">
            Are you sure you want to cancel
            <br />
            the registration for this event?
          </h2>

          <p className="mt-4 text-sm text-gray-600">
            If you change your mind, you can always re-register.
            <br />
            Please select which participants will no longer be attending.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {userInfo.alreadyRegistered && (
            <div className="flex items-center space-x-3">
              <Checkbox
                id={userInfo.id}
                checked={selectedAttendees.includes(userInfo.id)}
                onCheckedChange={(checked) => {
                  setSelectedAttendees((prev) =>
                    checked ? [...prev, userInfo.id] : prev.filter((id) => id !== userInfo.id),
                  );
                }}
              />
              <label
                htmlFor={userInfo.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {userInfo.name}
              </label>
            </div>
          )}

          {userInfo.family.map(
            (member) =>
              member.alreadyRegistered && (
                <div key={member.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={member.id}
                    checked={selectedAttendees.includes(member.id)}
                    onCheckedChange={(checked) => {
                      setSelectedAttendees((prev) =>
                        checked ? [...prev, member.id] : prev.filter((id) => id !== member.id),
                      );
                    }}
                  />
                  <label
                    htmlFor={member.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {member.name}
                  </label>
                </div>
              ),
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            className="w-full bg-[#45575e] text-white hover:bg-[#3a4a51]"
            onClick={() => onOpenChange(false)}
          >
            No, go back to
            <br />
            event details
          </Button>
          <Button
            className="w-full bg-[#488644] text-white hover:bg-[#3a6d37]"
            onClick={handleClick}
            disabled={selectedAttendees.length === 0}
          >
            Yes, cancel registration
            <br />
            for {getSelectedNames()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

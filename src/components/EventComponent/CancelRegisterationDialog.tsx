"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  type: "user" | "child";
}

interface CancelRegistrationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  participants: Participant[];
  onSuccess: (cancelledParticipants: string[]) => void;
}

export function CancelRegistrationDialog({
  isOpen,
  onOpenChange,
  eventId,
  participants,
  onSuccess,
}: CancelRegistrationDialogProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckboxChange = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    );
  };

  const getSelectedNames = () => {
    return participants
      .filter((p) => selectedParticipants.includes(p.id))
      .map((p) => p.name)
      .join(", ");
  };

  const handleCancel = async () => {
    if (selectedParticipants.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendees: selectedParticipants,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel registration");
      }

      // Pass the cancelled participants back to the parent
      onSuccess(selectedParticipants);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Are you sure you want to cancel the registration for this event?
          </DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-center text-sm text-muted-foreground">
            If you change your mind, you can always re-register.
            <br />
            Please select which participants will no longer be attending.
          </p>

          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-2">
                <Checkbox
                  id={participant.id}
                  checked={selectedParticipants.includes(participant.id)}
                  onCheckedChange={() => handleCheckboxChange(participant.id)}
                />
                <Label htmlFor={participant.id} className="cursor-pointer">
                  {participant.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            No, go back to event details
          </Button>
          <Button
            onClick={handleCancel}
            disabled={selectedParticipants.length === 0 || isLoading}
            className="w-full bg-[#488644] text-white hover:bg-[#3a6d37]"
            title={selectedParticipants.length > 0 ? `Cancel registration for ${getSelectedNames()}` : ""}
          >
            {isLoading
              ? "Cancelling..."
              : selectedParticipants.length > 0
                ? selectedParticipants.length === 1
                  ? `Yes, cancel for ${getSelectedNames()}`
                  : `Yes, cancel for selected (${selectedParticipants.length})`
                : "Select participants to cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// src/components/EventComponent/RemoveParticipantDialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isChild: boolean;
}

interface RemoveParticipantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  onParticipantRemoved: (removedParticipants: Participant[]) => void;
}

export function RemoveParticipantDialog({
  isOpen,
  onOpenChange,
  eventId,
  eventTitle,
  onParticipantRemoved,
}: RemoveParticipantDialogProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (!response.ok) throw new Error("Failed to fetch participants");

      const data = await response.json();
      const allParticipants: Participant[] = [
        ...data.registeredUsers.map((user: any) => ({
          id: user.user._id,
          name: `${user.user.firstName} ${user.user.lastName}`,
          isChild: false,
        })),
        ...data.registeredChildren.map((child: any) => ({
          id: child.childId,
          name: `${child.child?.firstName || "Unknown"} ${child.child?.lastName || "Child"}`,
          isChild: true,
        })),
      ];

      setParticipants(allParticipants);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load participants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchParticipants();
    }
  }, [isOpen, fetchParticipants]);

  const handleCheckboxChange = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
    );
  };

  const handleRemove = async () => {
    if (selectedParticipants.length === 0) return;

    setIsRemoving(true);
    try {
      const removedParticipants: Participant[] = [];

      for (const participantId of selectedParticipants) {
        const participant = participants.find((p) => p.id === participantId);
        if (!participant) continue;

        const response = await fetch(`/api/events/${eventId}/participants`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId,
            isChild: participant.isChild,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to remove participant");
        }

        removedParticipants.push(participant);
      }

      onParticipantRemoved(removedParticipants);
      onOpenChange(false);
      setSelectedParticipants([]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove participants",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Participants</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Select participants to remove from &quot;{eventTitle}&quot;. This will also remove all associated waivers.
          </p>

          {loading ? (
            <div className="py-4 text-center">Loading participants...</div>
          ) : (
            <div className="max-h-60 space-y-3 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={participant.id}
                    checked={selectedParticipants.includes(participant.id)}
                    onCheckedChange={() => handleCheckboxChange(participant.id)}
                  />
                  <Label htmlFor={participant.id} className="cursor-pointer">
                    {participant.name} {participant.isChild && "(Child)"}
                  </Label>
                </div>
              ))}
              {participants.length === 0 && (
                <div className="py-4 text-center text-muted-foreground">No participants found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={selectedParticipants.length === 0 || isRemoving}
          >
            {isRemoving ? "Removing..." : `Remove (${selectedParticipants.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

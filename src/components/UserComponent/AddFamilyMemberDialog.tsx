"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Gender } from "@/components/UserComponent/UserInfo";

interface AddFamilyMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memberData: { firstName: string; lastName: string; birthday: string; gender: Gender }) => void;
}

const genderOptions: Gender[] = ["Male", "Female", "Non-binary", "Prefer not to say"];

export function AddFamilyMemberDialog({ isOpen, onClose, onSubmit }: AddFamilyMemberDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<Gender>("");

  const handleSubmit = () => {
    if (!firstName || !lastName || !birthday || !gender) {
      alert("All fields are required");
      return;
    }

    onSubmit({ firstName, lastName, birthday, gender });

    // Reset form
    setFirstName("");
    setLastName("");
    setBirthday("");
    setGender("");
  };

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    setBirthday("");
    setGender("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a new family member to your account. You can update their emergency contacts and medical information
            after adding them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-firstName">First Name</Label>
              <Input
                id="add-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-lastName">Last Name</Label>
              <Input
                id="add-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-birthday">Date of Birth</Label>
            <Input id="add-birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-gender">Gender</Label>
            <Select value={gender} onValueChange={(value) => setGender(value as Gender)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Family Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

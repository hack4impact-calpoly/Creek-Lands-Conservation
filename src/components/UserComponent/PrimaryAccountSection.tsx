"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Edit3, Save, X } from "lucide-react";
import type { Gender } from "@/components/UserComponent/UserInfo";

interface PrimaryAccountSectionProps {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthday: string;
  phoneNumbers: { cell: string; work: string };
  address: { home: string; city: string; zipCode: string };
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  onPhoneChange: (field: "cell" | "work", value: string) => void;
  onAddressChange: (field: "home" | "city" | "zipCode", value: string) => void;
  onSave?: () => Promise<void>;
}

const genderOptions: Gender[] = ["Male", "Female", "Non-binary", "Prefer not to say"];

export function PrimaryAccountSection({
  firstName,
  lastName,
  gender,
  birthday,
  phoneNumbers,
  address,
  isEditing: globalIsEditing,
  onChange,
  onPhoneChange,
  onAddressChange,
  onSave,
}: PrimaryAccountSectionProps) {
  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = globalIsEditing || localIsEditing;

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave();
        setLocalIsEditing(false);
      } catch (error) {
        console.error("Save failed:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      setLocalIsEditing(false);
    }
  };

  const handleCancel = () => {
    setLocalIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <div>
              <CardTitle>Primary Account Holder</CardTitle>
              <CardDescription>Personal information for the primary account holder</CardDescription>
            </div>
          </div>

          {!globalIsEditing && (
            <div className="flex gap-2">
              {localIsEditing ? (
                <>
                  <Button onClick={handleSave} size="sm" disabled={isSaving} className="gap-1">
                    <Save className="h-3 w-3" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="gap-1">
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setLocalIsEditing(true)} variant="outline" size="sm" className="gap-1">
                  <Edit3 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => onChange("firstName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => onChange("lastName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={(value) => onChange("gender", value)} disabled={!isEditing}>
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

          <div className="space-y-2">
            <Label htmlFor="birthday">Date of Birth</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => onChange("birthday", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cellPhone">Cell Phone</Label>
            <Input
              id="cellPhone"
              type="tel"
              value={phoneNumbers.cell}
              onChange={(e) => onPhoneChange("cell", e.target.value)}
              disabled={!isEditing}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workPhone">Work Phone</Label>
            <Input
              id="workPhone"
              type="tel"
              value={phoneNumbers.work}
              onChange={(e) => onPhoneChange("work", e.target.value)}
              disabled={!isEditing}
              placeholder="(555) 987-6543"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

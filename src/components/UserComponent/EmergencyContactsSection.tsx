"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Phone, Edit3, Save, X } from "lucide-react";
import type { EmergencyContact } from "@/components/UserComponent/UserInfo";
import { Checkbox } from "@/components/ui/checkbox";

interface EmergencyContactsSectionProps {
  contacts: EmergencyContact[];
  usePrimaryContacts: boolean;
  primaryContacts: EmergencyContact[];
  isEditing: boolean;
  onUpdate: (index: number, contact: EmergencyContact) => void;
  onUsePrimaryChange: (usePrimary: boolean) => void;
  showPrimaryOption?: boolean;
  onSave?: () => Promise<void>;
}

export function EmergencyContactsSection({
  contacts,
  usePrimaryContacts,
  primaryContacts,
  isEditing: globalIsEditing,
  onUpdate,
  onUsePrimaryChange,
  showPrimaryOption = false,
  onSave,
}: EmergencyContactsSectionProps) {
  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = globalIsEditing || localIsEditing;
  const effectiveContacts = usePrimaryContacts ? primaryContacts : contacts;

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
            <Phone className="h-5 w-5" />
            <div>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>
                Provide up to two emergency contacts who can be reached in case of an emergency
              </CardDescription>
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
      <CardContent className="space-y-8">
        {showPrimaryOption && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="usePrimaryContacts"
              checked={usePrimaryContacts}
              onCheckedChange={onUsePrimaryChange}
              disabled={!isEditing}
            />
            <Label htmlFor="usePrimaryContacts" className="text-sm">
              Use primary account holder&apos;s emergency contacts
            </Label>
          </div>
        )}

        {effectiveContacts.map((contact, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium text-gray-900">Contact #{index + 1}</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`contact-name-${index}`}>Full Name</Label>
                <Input
                  id={`contact-name-${index}`}
                  value={contact.name}
                  onChange={(e) => onUpdate(index, { ...contact, name: e.target.value })}
                  disabled={!isEditing || usePrimaryContacts}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`contact-relationship-${index}`}>Relationship</Label>
                <Input
                  id={`contact-relationship-${index}`}
                  value={contact.relationship}
                  onChange={(e) => onUpdate(index, { ...contact, relationship: e.target.value })}
                  disabled={!isEditing || usePrimaryContacts}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`contact-phone-${index}`}>Phone Number</Label>
                <Input
                  id={`contact-phone-${index}`}
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => onUpdate(index, { ...contact, phone: e.target.value })}
                  disabled={!isEditing || usePrimaryContacts}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`contact-work-${index}`}>Work Number</Label>
                <Input
                  id={`contact-work-${index}`}
                  type="tel"
                  value={contact.work}
                  onChange={(e) => onUpdate(index, { ...contact, work: e.target.value })}
                  disabled={!isEditing || usePrimaryContacts}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Authorized for pickup?</Label>
              <RadioGroup
                value={contact.canPickup ? "yes" : "no"}
                onValueChange={(value) => onUpdate(index, { ...contact, canPickup: value === "yes" })}
                disabled={!isEditing || usePrimaryContacts}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`pickup-yes-${index}`} />
                  <Label htmlFor={`pickup-yes-${index}`}>Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`pickup-no-${index}`} />
                  <Label htmlFor={`pickup-no-${index}`}>No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

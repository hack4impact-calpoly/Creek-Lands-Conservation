"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MapPin, Edit3, Save, X } from "lucide-react";

interface AddressSectionProps {
  address: { home: string; city: string; zipCode: string };
  usePrimaryAddress: boolean;
  primaryAddress: { home: string; city: string; zipCode: string };
  isEditing: boolean;
  onAddressChange: (field: "home" | "city" | "zipCode", value: string) => void;
  onUsePrimaryChange: (usePrimary: boolean) => void;
  showPrimaryOption?: boolean;
  onSave?: () => Promise<void>;
}

export function AddressSection({
  address,
  usePrimaryAddress,
  primaryAddress,
  isEditing: globalIsEditing,
  onAddressChange,
  onUsePrimaryChange,
  showPrimaryOption = false,
  onSave,
}: AddressSectionProps) {
  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = globalIsEditing || localIsEditing;
  const effectiveAddress = usePrimaryAddress ? primaryAddress : address;

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
            <MapPin className="h-5 w-5" />
            <div>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Residential address information</CardDescription>
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
        {showPrimaryOption && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="usePrimaryAddress"
              checked={usePrimaryAddress}
              onCheckedChange={onUsePrimaryChange}
              disabled={!isEditing}
            />
            <Label htmlFor="usePrimaryAddress" className="text-sm">
              Use primary account holder&apos;s address
            </Label>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="homeAddress">Home Address</Label>
            <Input
              id="homeAddress"
              value={effectiveAddress.home}
              onChange={(e) => onAddressChange("home", e.target.value)}
              disabled={!isEditing || usePrimaryAddress}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={effectiveAddress.city}
                onChange={(e) => onAddressChange("city", e.target.value)}
                disabled={!isEditing || usePrimaryAddress}
                placeholder="San Francisco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={effectiveAddress.zipCode}
                onChange={(e) => onAddressChange("zipCode", e.target.value)}
                disabled={!isEditing || usePrimaryAddress}
                placeholder="94102"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";

interface AddressSectionProps {
  address: { home: string; city: string; zipCode: string };
  usePrimaryAddress: boolean;
  primaryAddress: { home: string; city: string; zipCode: string };
  isEditing: boolean;
  onAddressChange: (field: "home" | "city" | "zipCode", value: string) => void;
  onUsePrimaryChange: (usePrimary: boolean) => void;
  showPrimaryOption?: boolean;
}

export function AddressSection({
  address,
  usePrimaryAddress,
  primaryAddress,
  isEditing,
  onAddressChange,
  onUsePrimaryChange,
  showPrimaryOption = false,
}: AddressSectionProps) {
  const effectiveAddress = usePrimaryAddress ? primaryAddress : address;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Information
        </CardTitle>
        <CardDescription>Residential address information</CardDescription>
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

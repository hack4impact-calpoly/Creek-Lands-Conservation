"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Info } from "lucide-react";
import type { MedicalInfo } from "@/components/UserComponent/UserInfo";

interface MedicalInfoSectionProps {
  data: MedicalInfo;
  isEditing: boolean;
  onUpdate: (updated: MedicalInfo) => void;
}

export function MedicalInfoSection({ data, isEditing, onUpdate }: MedicalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Medical Information
        </CardTitle>
        <CardDescription>Medical details and emergency health information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="insurance">Health Insurance Provider</Label>
            <Input
              id="insurance"
              value={data.insurance}
              onChange={(e) => onUpdate({ ...data, insurance: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g., Cigna, Anthem Blue Cross"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctorName">Doctor Name</Label>
            <Input
              id="doctorName"
              value={data.doctorName}
              onChange={(e) => onUpdate({ ...data, doctorName: e.target.value })}
              disabled={!isEditing}
              placeholder="Dr. John Smith"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctorPhone">Doctor Phone Number</Label>
          <Input
            id="doctorPhone"
            type="tel"
            value={data.doctorPhone}
            onChange={(e) => onUpdate({ ...data, doctorPhone: e.target.value })}
            disabled={!isEditing}
            placeholder="(555) 123-4567"
            className="max-w-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies and Medications</Label>
          <Textarea
            id="allergies"
            value={data.allergies}
            onChange={(e) => onUpdate({ ...data, allergies: e.target.value })}
            disabled={!isEditing}
            placeholder="e.g., Allergic to bees and peanuts, carries an epipen"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="behaviorNotes">Behavior Notes / Support Needs</Label>
          <Textarea
            id="behaviorNotes"
            value={data.behaviorNotes}
            onChange={(e) => onUpdate({ ...data, behaviorNotes: e.target.value })}
            disabled={!isEditing}
            placeholder="Any behavioral considerations or support needs..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
          <Textarea
            id="dietaryRestrictions"
            value={data.dietaryRestrictions}
            onChange={(e) => onUpdate({ ...data, dietaryRestrictions: e.target.value })}
            disabled={!isEditing}
            placeholder="e.g., vegetarian, gluten-free"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}

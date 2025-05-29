"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Info } from "lucide-react";

interface ConsentSectionProps {
  photoRelease: boolean;
  isEditing: boolean;
  onUpdate: (photoRelease: boolean) => void;
}

export function ConsentSection({ photoRelease, isEditing, onUpdate }: ConsentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consent & Permissions
        </CardTitle>
        <CardDescription>Legal consents and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Photo Release:</strong> I hereby consent that any photograph in which my child or ward appears that
            is taken during participation in a Program or other Creek Lands Conservation activity may be used by Creek
            Lands Conservation, its funders, and partners without compensation for purposes of publicity or advertising
            in social media, catalogs, flyers, news stories, etc.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label>Photo Release Consent</Label>
          <RadioGroup
            value={photoRelease ? "yes" : "no"}
            onValueChange={(value) => onUpdate(value === "yes")}
            disabled={!isEditing}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="photo-yes" />
              <Label htmlFor="photo-yes">Yes, I consent</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="photo-no" />
              <Label htmlFor="photo-no">No, I do not consent</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

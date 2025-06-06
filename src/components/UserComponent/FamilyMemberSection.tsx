"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Trash2, Edit3, Save, X } from "lucide-react";
import type { Child, Gender } from "@/components/UserComponent/UserInfo";

interface FamilyMemberSectionProps {
  child: Child;
  isEditing: boolean;
  onEdit: (localId: number, field: keyof Child, value: string) => void;
  onDelete: (localId: number, childId?: string) => void;
  onSave?: () => Promise<void>;
}

const genderOptions: Gender[] = ["Male", "Female", "Non-binary", "Prefer not to say"];

export function FamilyMemberSection({
  child,
  isEditing: globalIsEditing,
  onEdit,
  onDelete,
  onSave,
}: FamilyMemberSectionProps) {
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
              <CardTitle>Family Member #{child.localId}</CardTitle>
              <CardDescription>
                {child.firstName} {child.lastName}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90%] rounded-lg sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {child.firstName} {child.lastName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(child.localId, child._id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`firstName-${child.localId}`}>First Name</Label>
            <Input
              id={`firstName-${child.localId}`}
              value={child.firstName}
              onChange={(e) => onEdit(child.localId, "firstName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`lastName-${child.localId}`}>Last Name</Label>
            <Input
              id={`lastName-${child.localId}`}
              value={child.lastName}
              onChange={(e) => onEdit(child.localId, "lastName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`gender-${child.localId}`}>Gender</Label>
            <Select
              value={child.gender}
              onValueChange={(value) => onEdit(child.localId, "gender", value)}
              disabled={!isEditing}
            >
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
            <Label htmlFor={`birthday-${child.localId}`}>Date of Birth</Label>
            <Input
              id={`birthday-${child.localId}`}
              type="date"
              value={child.birthday}
              onChange={(e) => onEdit(child.localId, "birthday", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import PersonalInfo from "@/components/UserComponent/PersonalInfo";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function UserProfile() {
  const { toast } = useToast();

  useEffect(() => {
    const shouldShowToast = localStorage.getItem("showProfileIncompleteToast");
    console.log(shouldShowToast);

    if (shouldShowToast) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile(s) to sign a waiver or register.",
        variant: "destructive",
      });
      localStorage.removeItem("showProfileIncompleteToast");
    }
  }, []);

  return (
    <main>
      <PersonalInfo></PersonalInfo>
    </main>
  );
}

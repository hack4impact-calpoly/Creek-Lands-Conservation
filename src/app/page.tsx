"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import PersonalInfo from "@/components/UserComponent/UserComponent";
import UserClerkID from "@/components/UserComponent/userID";
import { User } from "lucide-react";

export default async function Home() {
  return (
    <main>
      <Navbar />
      <Button>Home</Button>
      <PersonalInfo></PersonalInfo>
      <UserClerkID></UserClerkID>
    </main>
  );
}

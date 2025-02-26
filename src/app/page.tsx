"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import PersonalInfo from "@/components/UserComponent/UserComponent";
export default function Home() {
  return (
    <main>
      <Navbar />
      <Button>Home</Button>
      <PersonalInfo></PersonalInfo>
    </main>
  );
}

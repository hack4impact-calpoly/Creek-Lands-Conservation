"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default async function Home() {
  return (
    <main>
      <Navbar />
      <Button>Home</Button>
    </main>
  );
}

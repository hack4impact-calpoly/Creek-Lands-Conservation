"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export default function BackButton({ className = "", size = "icon" }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => router.back()}
      className={`group rounded-full ${className}`}
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
    </Button>
  );
}

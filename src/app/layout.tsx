// Layout.tsx
import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creek Lands Conservation Event Management Website",
  description: "A web app that manages events for Creek Lands Conservation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

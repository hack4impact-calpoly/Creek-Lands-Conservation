import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

//! Update metadata to match your project
export const metadata: Metadata = {
  title: "Creek Lands Conservation Event Management Website",
  description: "A web app that manages event for Creek Lands Conservation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

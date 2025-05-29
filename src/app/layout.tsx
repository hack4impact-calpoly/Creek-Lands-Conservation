// Layout.tsx
import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import "./globals.css";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Creek Lands Conservation Event Management Website",
  description: "A web app that manages events for Creek Lands Conservation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body className="min-h-full">
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

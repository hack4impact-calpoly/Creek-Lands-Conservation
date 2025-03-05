"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b-2 border-gray-400 bg-white shadow-md">
      <div className="flex h-20 w-full items-center bg-white px-8">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/creek_lands_conservation.png"
              alt="Creek Lands Logo"
              width={120}
              height={30}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Centered Navigation Links */}
        <div className="flex h-full flex-grow justify-center">
          <div className="flex h-full">
            <Link
              href="/"
              className={`relative flex h-full items-center px-8 text-xl font-semibold transition duration-200 ${
                pathname === "/"
                  ? "text-primary underline decoration-4 underline-offset-8"
                  : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
              }`}
            >
              Events
            </Link>
            <Link
              href="/waivers"
              className={`relative flex h-full items-center px-8 text-xl font-semibold transition duration-200 ${
                pathname === "/waivers"
                  ? "text-primary underline decoration-4 underline-offset-8"
                  : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
              }`}
            >
              Waivers
            </Link>
          </div>
        </div>

        {/* Right Section: Profile & Avatar Handling */}
        <div className="flex h-full items-center space-x-4">
          {/* Signed In: Show Profile Link & User Avatar */}
          <SignedIn>
            <Link
              href="/user"
              className={`relative flex h-full items-center px-6 text-xl font-semibold transition duration-200 ${
                pathname === "/user"
                  ? "text-primary underline decoration-4 underline-offset-8"
                  : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
              }`}
            >
              My Profile
            </Link>
            <div className="flex h-full items-center">
              <UserButton />
            </div>
          </SignedIn>

          {/* Signed Out: Redirect to Sign-In Page */}
          <SignedOut>
            {/* My Profile Redirect */}
            <SignInButton>
              <Link
                href="/user"
                className="relative flex h-full items-center px-6 text-xl font-semibold text-gray-700 transition duration-200 hover:underline hover:decoration-4 hover:underline-offset-8"
              >
                My Profile
              </Link>
            </SignInButton>

            {/* Default Gray Avatar Redirect */}
            <SignInButton>
              <Link
                href="/"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 transition duration-200 hover:bg-gray-400"
              >
                <User className="h-6 w-6 text-gray-600" />
              </Link>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

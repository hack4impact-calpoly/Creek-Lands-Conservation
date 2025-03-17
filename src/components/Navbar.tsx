"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { User, Menu, ChevronRight, X } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full border-b-2 border-gray-400 bg-white shadow-md">
      <div className="flex h-20 w-full items-center bg-white px-8">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/creek_lands_conservation.png"
              alt="Creek Lands Logo"
              width={120}
              height={30}
              style={{ width: "auto", height: "auto" }}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Centered Navigation Links (Desktop) */}
        <div className="hidden h-full flex-grow justify-center md:flex">
          <div className="flex h-full">
            {[
              { label: "Events", href: "/" },
              { label: "Waivers", href: "/waivers" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`relative flex h-full items-center px-8 text-xl font-semibold transition duration-200 ${
                  pathname === href
                    ? "text-primary underline decoration-4 underline-offset-8"
                    : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section: Profile & Mobile Menu */}
        <div className="ml-auto flex h-full items-center space-x-4">
          {/* Signed In: Show Profile Link & User Avatar */}
          <SignedIn>
            <Link
              href="/user"
              className={`relative hidden h-full items-center px-6 text-xl font-semibold transition duration-200 md:flex ${
                pathname === "/user"
                  ? "text-primary underline decoration-4 underline-offset-8"
                  : "text-gray-700 hover:underline hover:decoration-4 hover:underline-offset-8"
              }`}
            >
              My Profile
            </Link>
            <div className="hidden h-full items-center md:flex">
              <UserButton />
            </div>
          </SignedIn>

          {/* Signed Out: Redirect to Sign-In Page */}
          <SignedOut>
            <SignInButton>
              <Link
                href="/user"
                className="relative hidden h-full items-center px-6 text-xl font-semibold text-gray-700 transition duration-200 hover:underline hover:decoration-4 hover:underline-offset-8 md:flex"
              >
                My Profile
              </Link>
            </SignInButton>
          </SignedOut>

          {/* Mobile Menu Button (Now Positioned at the Very Right) */}
          <button
            className="ml-auto flex items-center justify-center rounded-md p-2 transition duration-200 hover:bg-gray-200 md:hidden"
            onClick={() => setIsOpen(true)}
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-64 border-l-2 border-gray-400 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4">
          <button onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Dropdown Menu Links */}
        <div className="flex flex-col space-y-6 px-6">
          {[
            { label: "Events", href: "/" },
            { label: "Waivers", href: "/waivers" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-lg font-semibold text-gray-700 transition duration-200 hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              {label}
            </Link>
          ))}

          {/* Signed In: Show Profile Link */}
          <SignedIn>
            <Link
              href="/user"
              className="text-lg font-semibold text-gray-700 transition duration-200 hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              My Profile
            </Link>
          </SignedIn>

          {/* Signed Out: Show Sign-In Option */}
          <SignedOut>
            <SignInButton>
              <div
                className="cursor-pointer text-lg font-semibold text-gray-700 transition duration-200 hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </div>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

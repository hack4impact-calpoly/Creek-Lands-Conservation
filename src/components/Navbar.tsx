"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { User, Menu, X } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full border-b border-gray-300 bg-white shadow-md">
      <div className="flex h-16 w-full items-center justify-between px-6 md:px-8">
        {/* Left: Logo */}
        <Link href="/">
          <Image
            src="/creek_lands_conservation.png"
            alt="Creek Lands Logo"
            width={120}
            height={30}
            className="object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden h-full flex-grow justify-center md:flex">
          <div className="flex h-full space-x-8">
            {[
              { label: "Events", href: "/" },
              { label: "Waivers", href: "/waivers" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`relative flex h-full items-center px-6 text-lg font-semibold transition duration-200 ${
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

        {/* Right: Profile & Mobile Menu */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <UserButton />
          </SignedIn>

          {/* Mobile Menu Button */}
          <button
            className="flex items-center justify-center rounded-md p-2 transition duration-200 hover:bg-gray-200 md:hidden"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown (Ensuring It's on Top) */}
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-64 border-l border-gray-300 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
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
              className="flex items-center space-x-3 text-lg font-semibold text-gray-700 hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-6 w-6" />
              <span>My Profile</span>
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

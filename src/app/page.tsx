import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Button>Home</Button>
      <Link href="/brandon">
        <Button variant="outline">Go To Brandon&apos;s Page</Button>
      </Link>
    </main>
  );
}

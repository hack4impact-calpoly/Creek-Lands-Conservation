import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Button>Home</Button>
      <Link href="/kjdiaz508">
        <button className="rounded-lg bg-blue-500 px-6 py-2 text-lg font-medium text-white hover:bg-blue-600">
          Kevin Diaz
        </button>
      </Link>
    </main>
  );
}

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import PersonalInfo from "@/components/UserComponent/UserComponent";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Button>Home</Button>
      <PersonalInfo userId="679aab451486a009aeb91ab0"></PersonalInfo>
    </main>
  );
}

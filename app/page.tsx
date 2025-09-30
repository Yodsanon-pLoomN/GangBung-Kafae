import { NavigationMenuDemo } from "@/components/nav";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="">
      <NavigationMenuDemo />
      <Button>Click me</Button>
    </div>
  );
}

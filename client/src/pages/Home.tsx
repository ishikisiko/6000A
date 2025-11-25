import { useLocation } from "wouter";
import Welcome from "./Welcome";

export default function Home() {
  const [, setLocation] = useLocation();

  return <Welcome onEnter={() => setLocation("/dashboard")} />;
}
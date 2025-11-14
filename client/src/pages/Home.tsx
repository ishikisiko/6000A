import { useState } from "react";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import Welcome from "./Welcome";
import Dashboard from "./Dashboard";
import Login from "./Login";

export default function Home() {
  const { user, loading, isAuthenticated } = useLocalAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - show login page
  if (!isAuthenticated) {
    return <Login />;
  }

  // Authenticated - show welcome screen or dashboard
  if (showWelcome) {
    return <Welcome onEnter={() => setShowWelcome(false)} />;
  }

  return <Dashboard userName={user?.name} />;
}

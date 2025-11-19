import { useLocalAuth } from "@/hooks/useLocalAuth";
import Dashboard from "./Dashboard";

export default function DashboardPage() {
  const { user } = useLocalAuth();
  return <Dashboard userName={user?.name || undefined} teamName={user?.team || 'FMH'} />;
}

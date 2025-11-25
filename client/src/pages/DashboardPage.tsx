import { useLocalAuth } from "@/hooks/useLocalAuth";
import Dashboard from "./Dashboard";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
  const { user } = useLocalAuth();
  return (
    <DashboardLayout>
      <Dashboard userName={user?.name || undefined} teamName={user?.team || 'FMH'} />
    </DashboardLayout>
  );
}

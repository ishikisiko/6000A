import { useState, useEffect } from 'react';
import { miniDB, LocalUser } from '@/lib/miniDB';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useLocalAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const utils = trpc.useUtils();

  // Use tRPC mutation for login
  const loginMutation = trpc.dev.login.useMutation({
    onSuccess: async (data) => {
      // Sync with miniDB using server ID
      const localUser = miniDB.syncUserWithServer(data);

      miniDB.setCurrentUser(localUser.id);
      setUser(localUser);

      // Invalidate auth.me to ensure session is synced
      await utils.auth.me.invalidate();

      toast.success(`Welcome back, ${localUser.name}!`);
    },
    onError: (error) => {
      console.error('Login failed:', error);
      toast.error('Login failed: ' + error.message);
    }
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  // Check for existing session on mount
  const { data: me, isLoading: isMeLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    miniDB.initDemoData();

    if (!isMeLoading) {
      if (me) {
        // Sync with miniDB using server ID
        const localUser = miniDB.syncUserWithServer(me);

        setUser(localUser);
        miniDB.setCurrentUser(localUser.id);
      } else {
        setUser(null);
        miniDB.logout();
      }
      setLoading(false);
    }
  }, [me, isMeLoading]);

  const login = (username: string) => {
    loginMutation.mutate({ username });
    return true;
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    miniDB.logout();
    setUser(null);
  };

  return {
    user,
    loading: loading || isMeLoading || loginMutation.isPending,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

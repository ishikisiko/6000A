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
      const name = data.name || 'User';

      // Sync with miniDB for backward compatibility and numeric ID
      let dbUser = miniDB.getUserByName(name);
      if (!dbUser) {
        dbUser = miniDB.createUser(name, 'admin');
      }

      // Update local state with miniDB user (has numeric ID)
      const localUser: LocalUser = {
        ...dbUser,
      };

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

  // Check for existing session on mount
  const { data: me, isLoading: isMeLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    miniDB.initDemoData();

    if (!isMeLoading) {
      if (me) {
        const name = me.name || 'User';
        let dbUser = miniDB.getUserByName(name);
        if (!dbUser) {
          dbUser = miniDB.createUser(name, 'admin');
        }

        const localUser: LocalUser = {
          ...dbUser,
        };

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

  const logout = () => {
    // Ideally should call server logout, but for now just clear local state
    // The server logout is trpc.auth.logout, but we can just clear local state for dev
    miniDB.logout();
    setUser(null);
    // Reload to clear httpOnly cookie if possible, or just let it expire
    // For dev flow, we might want to add a logout mutation call here if strictness is needed
    // But simply clearing local state is enough to show login screen
    window.location.reload();
  };

  return {
    user,
    loading: loading || isMeLoading || loginMutation.isPending,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

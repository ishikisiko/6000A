import { trpc } from '@/lib/trpc';

/**
 * Hook to get user's competition points
 */
export function useUserPoints() {
  const { data, isLoading, error, refetch } = trpc.topics.myPoints.useQuery(undefined, {
    // Refetch every 30 seconds to keep points updated
    refetchInterval: 30000,
    // Keep previous data while refetching
    placeholderData: (previousData) => previousData,
    // Retry on error
    retry: false,
  });

  return {
    points: data?.points ?? 0,
    isLoading,
    error,
    refetch,
  };
}

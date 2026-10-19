import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/api-types";
import { useAuth } from "@/contexts/AuthContext";

/** The signed-in user's email, display name and prayer zone. */
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: api.profile,
    enabled: !!user,
  });
}

/** Saves profile fields, showing them straight away and rolling back if saving fails. */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["profile", user?.id];

  return useMutation({
    mutationFn: api.updateProfile,
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<Profile>(key);
      if (before) queryClient.setQueryData<Profile>(key, { ...before, ...changes });
      return { before };
    },
    onError: (_e, _changes, ctx) => {
      if (ctx?.before) queryClient.setQueryData(key, ctx.before);
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  });
}

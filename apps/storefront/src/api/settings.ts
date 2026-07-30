import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

export function usePublicSettings() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const response = await apiClient<{ data: { settings: Record<string, any> } }>("/settings");
      return response.data?.settings || {};
    },
    staleTime: 1000 * 60 * 2,
  });
}

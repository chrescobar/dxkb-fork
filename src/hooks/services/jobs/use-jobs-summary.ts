import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch-client";

interface JobsSummaryData {
  taskSummary: Record<string, number>;
  appSummary: Record<string, number>;
}

export function useJobsSummary(includeArchived: boolean) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery<JobsSummaryData, Error>({
    queryKey: ["jobs-summary", includeArchived],
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const response = await authenticatedFetch(
        "/api/services/app-service/jobs/summary",
        {
          method: "POST",
          body: JSON.stringify({ include_archived: includeArchived }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch job summaries: ${response.statusText}`,
        );
      }
      const data = await response.json();

      const rawTask = data.taskSummary;
      const rawApp = data.appSummary;

      return {
        // BV-BRC JSON-RPC may wrap results in an extra array
        taskSummary: (Array.isArray(rawTask) ? rawTask[0] : rawTask) ?? {},
        appSummary: (Array.isArray(rawApp) ? rawApp[0] : rawApp) ?? {},
      };
    },
  });
}

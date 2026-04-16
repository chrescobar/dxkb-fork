import { useApiQuery } from "@/lib/api/hooks";
import { apiCall } from "@/lib/api/client";

interface JobsSummaryData {
  taskSummary: Record<string, number>;
  appSummary: Record<string, number>;
}

export function useJobsSummary(includeArchived: boolean) {
  return useApiQuery<JobsSummaryData>({
    queryKey: ["jobs-summary", includeArchived],
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const data = await apiCall<{
        taskSummary: unknown;
        appSummary: unknown;
      }>("/api/services/app-service/jobs/summary", {
        include_archived: includeArchived,
      });

      const rawTask = data.taskSummary;
      const rawApp = data.appSummary;

      return {
        taskSummary: ((Array.isArray(rawTask) ? rawTask[0] : rawTask) ?? {}) as Record<string, number>,
        appSummary: ((Array.isArray(rawApp) ? rawApp[0] : rawApp) ?? {}) as Record<string, number>,
      };
    },
  });
}

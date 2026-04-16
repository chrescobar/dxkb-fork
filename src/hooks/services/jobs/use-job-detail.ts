import { useApiQuery } from "@/lib/api/hooks";
import { apiGet } from "@/lib/api/client";
import type { JobDetails } from "@/types/workspace";
import { activeJobStatuses } from "@/lib/jobs/constants";

export function useJobDetail(jobId: string | null) {
  return useApiQuery<JobDetails>({
    queryKey: ["job-detail", jobId],
    queryFn: () => apiGet<JobDetails>(`/api/services/app-service/jobs/${jobId}`),
    enabled: !!jobId,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && activeJobStatuses.includes(status)) return 3_000;
      return false;
    },
    refetchIntervalInBackground: false,
  });
}

export function useJobOutput(
  jobId: string | null,
  outputType: "stdout" | "stderr",
  enabled: boolean,
) {
  return useApiQuery<string>({
    queryKey: ["job-output", jobId, outputType],
    queryFn: () =>
      apiGet<string>(`/api/services/app-service/jobs/${jobId}/${outputType}`),
    enabled: !!jobId && enabled,
    staleTime: 60_000,
  });
}

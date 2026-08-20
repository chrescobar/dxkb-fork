import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCall } from "@/lib/api/client";
import { toast } from "sonner";
import type { KillJobResponse } from "@/types/workspace";

export function useKillJob() {
  const queryClient = useQueryClient();

  return useMutation<KillJobResponse, Error, string>({
    mutationFn: async (jobId) => {
      return apiCall<KillJobResponse>(
        `/api/services/app-service/jobs/${jobId}/kill`,
        undefined,
      );
    },
    onSuccess: (data, jobId) => {
      toast.success(`Kill request for Job ${jobId} was sent successfully`);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs-filtered"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs-summary"] });
    },
    onError: (error, jobId) => {
      toast.error(`Failed to kill Job ${jobId}: ${error.message}`);
    },
  });
}

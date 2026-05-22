import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthBoundary } from "@/lib/auth/provider";
import { memoryAuthAdapter } from "@/lib/auth/adapters/memory";
import { ServiceDebuggingProvider } from "@/contexts/service-debugging-context";

interface ServicePageProvidersProps {
  children: ReactNode;
  user?: {
    username?: string;
    email?: string;
    token?: string;
  };
}

export function ServicePageProviders({ children, user }: ServicePageProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const session = {
    username: user?.username ?? "testuser",
    email: user?.email ?? "test@example.com",
    token: user?.token ?? "test-token",
    email_verified: true,
  };
  const port = memoryAuthAdapter({
    initialSession: session,
    onRequest: (input, init) => fetch(input, init),
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBoundary
        port={port}
        initialUser={{
          username: session.username,
          email: session.email,
          token: session.token,
          email_verified: true,
        }}
      >
        <ServiceDebuggingProvider>{children}</ServiceDebuggingProvider>
      </AuthBoundary>
    </QueryClientProvider>
  );
}

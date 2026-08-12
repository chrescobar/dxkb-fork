import { useAuth } from "@/lib/auth/hooks";
import { cn } from "@/lib/utils";

export function useAuthStyles() {
  const { isAuthenticated, status } = useAuth();
  const isLoading = status === "loading";

  const authClass = (
    authenticatedClass: string,
    unauthenticatedClass: string,
  ) => {
    return isAuthenticated ? authenticatedClass : unauthenticatedClass;
  };

  const authClasses = (classes: Record<string, boolean>) => {
    return cn(
      Object.entries(classes).flatMap(([className, condition]) =>
        condition ? [className] : [],
      ),
    );
  };

  const whenAuthenticated = (className: string) => {
    return isAuthenticated ? className : "";
  };

  const whenUnauthenticated = (className: string) => {
    return !isAuthenticated ? className : "";
  };

  const whenLoading = (className: string) => {
    return isLoading ? className : "";
  };

  return {
    authClass,
    authClasses,
    whenAuthenticated,
    whenUnauthenticated,
    whenLoading,
    isAuthenticated,
    isLoading,
  };
}

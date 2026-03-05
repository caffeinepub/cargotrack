import { useInternetIdentity } from "./useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "./useQueries";

export function useAuth() {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: profile, isLoading: isProfileLoading } = useCallerProfile();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return {
    identity,
    isAuthenticated,
    isAdmin: isAdmin ?? false,
    profile,
    login,
    logout: clear,
    isInitializing,
    isLoggingIn,
    isLoading: isAdminLoading || isProfileLoading,
  };
}

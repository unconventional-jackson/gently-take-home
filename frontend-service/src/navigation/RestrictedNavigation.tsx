import { Box, CircularProgress } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAuth } from '../contexts/useAuth';
import { NavigationLayout } from './NavigationLayout';

export function RestrictedNavigation() {
  const { authUser, initialized } = useAuth();
  console.log('resiting');
  const location = useLocation();
  const params = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);

    /**
     * Error callback
     * http://localhost:5173/login/callback?error_description=Invalid+SAML+response+received%3A+PreSignUp+failed+with+error+Invalid+email+domain.+&error=server_error
     */
    const errorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    return {
      errorDescription,
      code,
    };
  }, [location.search]);

  useEffect(() => {
    if (params.errorDescription) {
      toast.error(params.errorDescription);
    }
  }, [params.errorDescription]);
  if (params.errorDescription) {
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  if (authUser) {
    // For admins and operators, use variant-specific redirect routes
    if (!authUser?.auth_email_verified) {
      return <Navigate to="/verify-email" state={{ from: location.pathname }} replace />;
    }
    if (!authUser?.auth_totp_enabled) {
      return <Navigate to="/totp-setup" state={{ from: location.pathname }} replace />;
    }
    if (!authUser?.auth_totp_verified_at) {
      return <Navigate to="/totp-verify" state={{ from: location.pathname }} replace />;
    }

    return (
      <NavigationLayout>
        <Outlet />
      </NavigationLayout>
    );
  }

  // /**
  //  * Fallback for a race condition on SSO callbacks
  //  * taking too long to be verified
  //  */
  if (!initialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={100} />
      </Box>
    );
  }

  return (
    <Navigate
      to="/sign-in"
      state={{
        from: location.pathname,
      }}
      replace
    />
  );
}

import { useQueryClient } from '@tanstack/react-query';
import { AuthUser } from '@unconventional-jackson/gently-openapi-service';
import { createContext, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSdk } from '../api/sdk';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AuthContextProps {
  authUser: AuthUser | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeNewPassword: (newPassword: string, token: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, password: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  totpSetup: (email: string) => Promise<{
    otpauth_url?: string;
  }>;
  totpVerify: (email: string, totpCode: string) => Promise<void>;
}

// Create the AuthContext with initial values
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthContext = createContext<AuthContextProps>({
  authUser: null,
  initialized: false,
  signIn: async () => Promise.resolve(),
  signUp: async () => Promise.resolve(),
  signOut: async () => Promise.resolve(),
  completeNewPassword: async () => Promise.resolve(),
  changePassword: async () => Promise.resolve(),
  requestPasswordReset: async () => Promise.resolve(),
  confirmPasswordReset: async () => Promise.resolve(),
  resendVerification: async () => Promise.resolve(),
  verifyEmail: async () => Promise.resolve(),
  totpSetup: async () => Promise.resolve({ otpauth_url: '' }),
  totpVerify: async () => Promise.resolve(),
});

export function AuthProvider({ children }: PropsWithChildren<unknown>) {
  const apiSdk = useSdk();
  const queryClient = useQueryClient();
  // Set an initializing state whilst Cognito / Amplify connects
  const [authUser, setAuthUser] = useLocalStorage<AuthUser | null>('user', null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      console.log('initialized', authUser);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      await apiSdk.signUp({
        email,
        password,
      });
    },
    [apiSdk]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await apiSdk.signIn({
        email,
        password,
      });
      if (response.data.user) {
        setAuthUser(response.data.user);
      }
    },
    [apiSdk, setAuthUser]
  );

  const completeNewPassword = useCallback(
    async (newPassword: string, token: string) => {
      await apiSdk.resetPassword({
        new_password: newPassword,
        token,
      });
    },
    [apiSdk]
  );
  const resendVerification = useCallback(
    async (email: string) => {
      await apiSdk.resendVerification({ email });
    },
    [apiSdk]
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      // Make a POST request to the verify email api
      const response = await apiSdk.verifyEmail({
        email,
        token: code,
      });
      if (response.data.user) {
        setAuthUser(response.data.user);
      }
    },
    [apiSdk, setAuthUser]
  );

  const totpSetup = useCallback(
    async (email: string) => {
      const response = await apiSdk.totpSetup({ email });

      // should contain `otpauth_url`
      return response.data;
    },
    [apiSdk]
  );

  const totpVerify = useCallback(
    async (email: string, totpCode: string) => {
      const response = await apiSdk.totpVerify({ email, token: totpCode });
      if (response.data.user) {
        setAuthUser(response.data.user);
      }
    },
    [apiSdk, setAuthUser]
  );

  const navigate = useNavigate();
  const signOut = useCallback(async () => {
    //navigate to /
    await Promise.resolve();
    queryClient.clear();
    localStorage.clear();
    setAuthUser(null);
    navigate('/');
  }, [queryClient, setAuthUser, navigate]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      await apiSdk.forgotPassword({
        email,
      });
    },
    [apiSdk]
  );

  // reset password
  const confirmPasswordReset = useCallback(
    async (email: string, code: string, password: string) => {
      // Make a POST request to the reset password API
      await apiSdk.resetPassword({
        email,
        new_password: password,
        token: code, // using code as the token
      });
    },
    [apiSdk]
  );

  /**
   * Changes a signed-in user's password
   */
  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!authUser?.email) {
        throw new Error('User is not signed in');
      }
      await apiSdk.changePassword({
        email: authUser?.email,
        current_password: oldPassword,
        new_password: newPassword,
      });
    },
    [apiSdk, authUser?.email]
  );

  return (
    <AuthContext.Provider
      value={{
        authUser,
        initialized,
        signIn,
        signUp,
        signOut,
        completeNewPassword,
        changePassword,
        requestPasswordReset,
        confirmPasswordReset,
        resendVerification,
        verifyEmail,
        totpSetup,
        totpVerify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

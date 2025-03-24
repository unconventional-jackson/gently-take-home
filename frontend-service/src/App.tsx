import 'swagger-ui-react/swagger-ui.css';
import 'react-toastify/dist/ReactToastify.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { asyncStoragePersistor, queryClient } from './api/client';
import { AuthProvider } from './contexts/AuthContext';
import { DebugContextProvider } from './contexts/DebugContext';
import { RestrictedNavigation } from './navigation/RestrictedNavigation';
import { Root } from './navigation/Root';
import { AttributesPage } from './screens/attributes/AttributesPage';
import { AuthContainer } from './screens/auth/AuthContainer/AuthContainer';
import { ChangePasswordScreen } from './screens/auth/ChangePassword';
import { ForgotPasswordScreen } from './screens/auth/ForgotPassword';
import { ResetPasswordScreen } from './screens/auth/ResetPassword';
import { SignInScreen } from './screens/auth/SignIn';
import { SignUpScreen } from './screens/auth/SignUp';
import { TotpSetupScreen } from './screens/auth/TotpSetup';
import { TotpVerifyScreen } from './screens/auth/TotpVerify';
import { VerifyEmailScreen } from './screens/auth/VerifyEmail';
import { APIDocumentationPage } from './screens/misc/APIDocumentationPage';
import { ProductPage } from './screens/products/ProductPage';
import { ProductsPage } from './screens/products/ProductsPage';

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersistor,
      }}
    >
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <BrowserRouter>
          <DebugContextProvider>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Root />} />

                <Route
                  element={
                    <AuthContainer>
                      <Outlet />
                    </AuthContainer>
                  }
                >
                  <Route path="sign-in" element={<SignInScreen />} />
                  <Route path="sign-up" element={<SignUpScreen />} />
                  <Route path="verify-email" element={<VerifyEmailScreen />} />
                  <Route path="totp-setup" element={<TotpSetupScreen />} />
                  <Route path="totp-verify" element={<TotpVerifyScreen />} />
                  <Route path="forgot-password" element={<ForgotPasswordScreen />} />
                  <Route path="password-reset" element={<ResetPasswordScreen />} />
                  <Route path="change-password" element={<ChangePasswordScreen />} />
                </Route>
                <Route path="app" element={<RestrictedNavigation />}>
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:product_id" element={<ProductPage />} />
                  <Route path="attributes" element={<AttributesPage />} />
                  <Route path="documentation" element={<APIDocumentationPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>

              <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </AuthProvider>
          </DebugContextProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </PersistQueryClientProvider>
  );
}

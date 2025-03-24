import { Grid } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';
import { AuthLocationState } from './utils';

export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification, verifyEmail } = useAuth();

  /**
   * If the user was redirected here from the sign-up screen, the email will be in the location state.
   */
  const [email, setEmail] = useState<string>('');
  const handleChangeEmail = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);
  useEffect(() => {
    const state = (location.state ?? {}) as AuthLocationState;
    if (state.email) {
      setEmail(state.email);
    }
  }, [location]);

  /**
   * The verification code entered by the user.
   */
  const [code, setCode] = useState<string>('');
  const handleChangeCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  }, []);

  const [loadingVerifyEmail, setLoadingVerifyEmail] = useState(false);
  const handleVerifyEmail = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoadingVerifyEmail(true);
        await verifyEmail(email.toLowerCase(), code);
        navigate('/totp-setup', { state: { email } });
      } catch (error) {
        toast.error(`Failed to verify email: ${parseAxiosError(error)}`);
      } finally {
        setLoadingVerifyEmail(false);
      }
    },
    [verifyEmail, email, code, navigate]
  );

  const [loadingResendVerification, setLoadingResendVerification] = useState(false);
  const handleResendVerification = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoadingResendVerification(true);
        await resendVerification(email.toLowerCase());
        toast.success('Verification email sent');
      } catch (error) {
        toast.error(`Failed to send verification email: ${parseAxiosError(error)}`);
      } finally {
        setLoadingResendVerification(false);
      }
    },
    [email, resendVerification]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <CustomInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          type="email"
          onChange={handleChangeEmail}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <CustomInput
          label="Verification Code"
          placeholder="Enter the verification code"
          value={code}
          onChange={handleChangeCode}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <CustomButton
          variant="contained"
          onClick={handleVerifyEmail}
          loading={loadingVerifyEmail}
          style={{
            width: '100%',
          }}
        >
          Verify Email
        </CustomButton>
      </Grid>

      <Grid item xs={12}>
        <CustomButton
          variant="outlined"
          onClick={handleResendVerification}
          loading={loadingResendVerification}
          style={{
            width: '100%',
          }}
        >
          Resend Verification Email
        </CustomButton>
      </Grid>
    </Grid>
  );
}

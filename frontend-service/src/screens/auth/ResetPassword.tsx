import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';
import { AuthLocationState } from './utils';

// Defined outside of the component to avoid re-creating the object on every render
const requirements = {
  '8 characters': /.{8,}/,
  '1 number': /\d/,
  '1 special character': /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/,
  '1 uppercase letter': /[A-Z]/,
  '1 lowercase letter': /[a-z]/,
};

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmPasswordReset, requestPasswordReset } = useAuth();

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

  const [code, setCode] = useState<string>('');
  const handleChangeCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value);
  }, []);

  const [password, setPassword] = useState<string>('');
  const handleChangePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  }, []);

  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const handleChangeConfirmPassword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
  }, []);

  const [loadingResetPassword, setLoadingResetPassword] = useState(false);
  const handleResetPassword = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoadingResetPassword(true);
        await confirmPasswordReset(email.toLowerCase(), code, password);
        toast.success('Password reset successfully');
        navigate('/sign-in');
      } catch (error) {
        toast.error(`Error completing password reset: ${parseAxiosError(error)}`);
      } finally {
        setLoadingResetPassword(false);
      }
    },
    [confirmPasswordReset, email, code, password, navigate]
  );

  const [loadingResendCode, setLoadingResendCode] = useState(false);
  const handleResendCode = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoadingResendCode(true);
        await requestPasswordReset(email.toLowerCase());
        toast.success('Code resent');
      } catch (error) {
        toast.error(`Failed to resend code: ${parseAxiosError(error)}`);
      } finally {
        setLoadingResendCode(false);
      }
    },
    [requestPasswordReset, email]
  );

  const emailValid = useMemo(() => /^.+@.+\..+$/.test(email), [email]);

  const passwordsMatch = useMemo(
    () => password && confirmPassword && password === confirmPassword,
    [password, confirmPassword]
  );

  const passwordValid = useMemo(
    () => Object.values(requirements).every((regex) => regex.test(password)),
    [password]
  );

  const disabled = useMemo(
    () => !emailValid || !code || !passwordValid || !passwordsMatch,
    [code, emailValid, passwordValid, passwordsMatch]
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
          label="Code"
          placeholder="Enter the code you received in your email"
          value={code}
          onChange={handleChangeCode}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <CustomInput
          label="New Password"
          placeholder="Enter your new password"
          value={password}
          type="password"
          onChange={handleChangePassword}
          fullWidth
        />
        {password
          ? Object.entries(requirements).map(([requirement, regex], index) => {
              const satisfied = regex.test(password);
              return (
                <div className="Auth-password-requirement-container" key={index}>
                  <FontAwesomeIcon
                    icon={satisfied ? faCheck : faTimes}
                    className={satisfied ? 'Auth-password-complete' : 'Auth-password-incomplete'}
                  />
                  <p className="Auth-password-requirement">Contains at least {requirement}</p>
                </div>
              );
            })
          : null}
      </Grid>
      <Grid item xs={12}>
        <CustomInput
          label="Confirm Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          type="password"
          onChange={handleChangeConfirmPassword}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <CustomButton
          variant="contained"
          onClick={handleResetPassword}
          disabled={disabled}
          loading={loadingResetPassword}
          style={{
            width: '100%',
          }}
        >
          Reset Password
        </CustomButton>
      </Grid>
      <Grid item xs={12}>
        <CustomButton
          variant="outlined"
          onClick={handleResendCode}
          loading={loadingResendCode}
          style={{
            width: '100%',
          }}
        >
          Resend Code
        </CustomButton>
      </Grid>
      <Grid item xs={6}>
        <CustomButton variant="text" onClick={() => navigate('/sign-in')} fullWidth>
          Already have an account? Sign in.
        </CustomButton>
      </Grid>
      <Grid item xs={6}>
        <CustomButton variant="text" onClick={() => navigate('/sign-up')} fullWidth>
          Need to create an account? Sign up.
        </CustomButton>
      </Grid>
    </Grid>
  );
}

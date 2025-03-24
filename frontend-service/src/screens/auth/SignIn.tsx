import { Grid } from '@mui/material';
import { useCallback, useState } from 'react';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';

export function SignInScreen() {
  const navigate = useNavigate();
  const location = useLocation() as Location<{
    from: string;
  }>;
  const { signIn } = useAuth();

  const [email, setEmail] = useState<string>('');
  const handleChangeEmail = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const [password, setPassword] = useState<string>('');
  const handleChangePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  }, []);

  const [loading, setLoading] = useState(false);
  const handleSignIn = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoading(true);
        await signIn(email.toLowerCase(), password);
        const redirectTo = location.state?.from || '/app/products';
        navigate(redirectTo, { replace: true });
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error?.response?.data?.error === 'Email not verified') {
          navigate('/verify-email', {
            state: { email },
          });
        } else {
          toast.error(`Failed to sign in: ${parseAxiosError(error)}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [signIn, email, password, location.state?.from, navigate]
  );

  const disabled = !email || !password;

  const forgotPasswordPath = '/forgot-password';
  const signUpPath = '/sign-up';

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
          label="Password"
          placeholder="Enter your password"
          value={password}
          type="password"
          onChange={handleChangePassword}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <CustomButton
          variant="contained"
          onClick={handleSignIn}
          disabled={disabled}
          loading={loading}
          style={{
            width: '100%',
          }}
        >
          Login
        </CustomButton>
      </Grid>
      <Grid item xs={6}>
        <CustomButton variant="text" onClick={() => navigate(forgotPasswordPath)} fullWidth>
          Forgot your password? Reset it.
        </CustomButton>
      </Grid>
      <Grid item xs={6}>
        <CustomButton variant="text" onClick={() => navigate(signUpPath)} fullWidth>
          Need an account? Sign up.
        </CustomButton>
      </Grid>
    </Grid>
  );
}

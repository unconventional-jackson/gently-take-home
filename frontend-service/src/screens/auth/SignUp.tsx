import { Cancel, CheckCircle } from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';

// Defined outside of the component to avoid re-creating the object on every render
const requirements = {
  '8 characters': /.{8,}/,
  '1 number': /\d/,
  '1 special character': /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/,
  '1 uppercase letter': /[A-Z]/,
  '1 lowercase letter': /[a-z]/,
};

export function SignUpScreen() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState<string>('');
  const handleChangeEmail = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const [password, setPassword] = useState<string>('');
  const handleChangePassword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  }, []);

  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const handleChangeConfirmPassword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
  }, []);

  const [loading, setLoading] = useState(false);
  const handleSignUp = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoading(true);
        await signUp(email.toLowerCase(), password);
        toast.success('Account created. Verify your email.');
        navigate('/verify-email', {
          state: { email },
        });
      } catch (error) {
        toast.error(`Failed to create account: ${parseAxiosError(error)}`);
      } finally {
        setLoading(false);
      }
    },
    [signUp, email, password, navigate]
  );

  const emailExists = useMemo(() => /^.+@.+\..+$/.test(email), [email]);
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
    () => !emailValid || !passwordValid || !passwordsMatch,
    [emailValid, passwordValid, passwordsMatch]
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
        {emailExists ? (
          <Box display="flex" alignItems="center" gap={1}>
            {emailValid ? <CheckCircle color="success" /> : <Cancel color="error" />}
            <Typography variant="subtitle1">Email must be valid</Typography>
          </Box>
        ) : null}
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
        {password
          ? Object.entries(requirements).map(([requirement, regex], index) => {
              const satisfied = regex.test(password);
              return (
                <Box display="flex" alignItems="center" gap={1} key={index}>
                  {satisfied ? <CheckCircle color="success" /> : <Cancel color="error" />}
                  <Typography variant="subtitle1">Contains at least {requirement}</Typography>
                </Box>
              );
            })
          : null}
      </Grid>
      <Grid item xs={12}>
        <CustomInput
          label="Confirm Password"
          placeholder="Confirm your password"
          type="password"
          value={confirmPassword}
          onChange={handleChangeConfirmPassword}
          fullWidth
        />
        {confirmPassword ? (
          <Box display="flex" alignItems="center" gap={1}>
            {passwordsMatch ? <CheckCircle color="success" /> : <Cancel color="error" />}
            <Typography variant="subtitle1">Passwords must match</Typography>
          </Box>
        ) : null}
      </Grid>
      <Grid item xs={12}>
        <CustomButton
          variant="contained"
          onClick={handleSignUp}
          disabled={disabled}
          loading={loading}
          style={{
            width: '100%',
          }}
        >
          Create Account
        </CustomButton>
      </Grid>
      <Grid item xs={12}>
        <CustomButton variant="text" onClick={() => navigate('/sign-in')} fullWidth>
          Already have an account? Sign in.
        </CustomButton>
      </Grid>
    </Grid>
  );
}

import { Grid, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState<string>('');
  const handleChangeEmail = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const handleForgotPassword = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      requestPasswordReset(email.toLowerCase())
        .then(() => {
          navigate('/password-reset', { state: { email } });
        })
        .catch((error) => {
          toast.error(`Failed to request password reset: ${parseAxiosError(error)}`);
        });
    },
    [email, navigate, requestPasswordReset]
  );

  const disabled = !email;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="body2">
          Forgot your password? Enter your email address below to request a password reset.
        </Typography>
      </Grid>
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
        <CustomButton
          variant="contained"
          onClick={handleForgotPassword}
          disabled={disabled}
          style={{
            width: '100%',
          }}
          fullWidth
        >
          Request Password Reset
        </CustomButton>
      </Grid>

      <Grid item xs={12}>
        <CustomButton variant="text" onClick={() => navigate('/password-reset')} fullWidth>
          Already have a password reset code?
        </CustomButton>
      </Grid>
    </Grid>
  );
}

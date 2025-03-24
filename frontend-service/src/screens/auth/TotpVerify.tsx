import { Grid, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';

export function TotpVerifyScreen() {
  const navigate = useNavigate();
  const location = useLocation() as Location<{
    from: string;
  }>;
  const { authUser, totpVerify } = useAuth();
  const [totpCode, setTotpCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Handle TOTP verification
  const handleTotpVerify = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      if (!authUser?.email) {
        toast.error("User's email is not available for TOTP verification");
        return;
      }
      try {
        setLoading(true);
        await totpVerify(authUser?.email, totpCode); // Pass the email along with the TOTP code
        toast.success('TOTP verified successfully');
        const redirectTo = location.state?.from || '/app/products';
        navigate(redirectTo, { replace: true });
      } catch (error) {
        toast.error(`Failed to verify TOTP: ${parseAxiosError(error)}`);
      } finally {
        setLoading(false);
      }
    },
    [authUser?.email, totpVerify, totpCode, location.state?.from, navigate]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="body2">Enter the code from your authenticator app</Typography>
      </Grid>
      <Grid item xs={12}>
        <CustomInput
          label="TOTP Code"
          placeholder="Enter the TOTP code"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value)}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <CustomButton
          variant="contained"
          onClick={handleTotpVerify}
          loading={loading}
          disabled={!totpCode}
          style={{ width: '100%' }}
        >
          Verify TOTP
        </CustomButton>
      </Grid>
    </Grid>
  );
}

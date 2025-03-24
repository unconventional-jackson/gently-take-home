import { Grid, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Location, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { QRCode } from '../../components/QRCode/QRCode';
import { useAuth } from '../../contexts/useAuth';
import { parseAxiosError } from '../../utils/errors';

export function TotpSetupScreen() {
  const navigate = useNavigate();
  const location = useLocation() as Location<{
    from: string;
  }>;
  const { authUser, totpSetup, totpVerify } = useAuth();
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch the TOTP setup URL (otpauth URL) when the screen loads

  useEffect(() => {
    async function fetchTotpSetup() {
      if (!authUser?.email) {
        return;
      }
      try {
        setLoading(true);
        const response = await totpSetup(authUser?.email);
        if (!response.otpauth_url) {
          throw new Error('Failed to fetch TOTP setup');
        }
        setOtpauthUrl(response.otpauth_url);
      } catch (error) {
        toast.error(`Failed to fetch TOTP setup: ${parseAxiosError(error)}`);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line no-console
    fetchTotpSetup().catch(console.error);
  }, [totpSetup, authUser?.email]);

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
        <Typography variant="h6">Set up Two-Factor Authentication (2FA)</Typography>
      </Grid>
      {otpauthUrl ? (
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Typography variant="body2">
            Scan the QR code below with your Google Authenticator app:
          </Typography>
          <QRCode data={otpauthUrl} altText="TOTP QR Code" />
        </Grid>
      ) : (
        <p>Loading QR code...</p>
      )}

      <Grid item xs={12}>
        <Typography variant="body2">Enter the code from your authenticator app</Typography>
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

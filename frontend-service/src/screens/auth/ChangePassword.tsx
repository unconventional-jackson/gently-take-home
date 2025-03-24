import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid } from '@mui/material';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../../components/Button/Button';
import { CustomInput } from '../../components/Custom/Input';
import { useAuth } from '../../contexts/useAuth';

// Defined outside of the component to avoid re-creating the object on every render
const requirements = {
  '8 characters': /.{8,}/,
  '1 number': /\d/,
  '1 special character': /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/,
  '1 uppercase letter': /[A-Z]/,
  '1 lowercase letter': /[a-z]/,
};

export function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { changePassword } = useAuth();

  const [oldPassword, setOldPassword] = useState<string>('');
  const handleChangeOldPassword = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOldPassword(event.target.value);
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
  const handleNewPassword = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      try {
        setLoading(true);
        await changePassword(oldPassword, password);
        const redirectTo = '/app/products';
        navigate(redirectTo);
      } catch (error) {
        toast.error('Failed to complete password reset');
      }
    },
    [changePassword, oldPassword, password, navigate]
  );

  const disabled = !password || !confirmPassword || password !== confirmPassword;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <CustomInput
          label="Current Password"
          placeholder="Enter your current password"
          value={oldPassword}
          type="password"
          onChange={handleChangeOldPassword}
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
          onClick={handleNewPassword}
          disabled={disabled}
          loading={loading}
          style={{
            width: '100%',
          }}
          fullWidth
        >
          Set New Password
        </CustomButton>
      </Grid>
    </Grid>
  );
}

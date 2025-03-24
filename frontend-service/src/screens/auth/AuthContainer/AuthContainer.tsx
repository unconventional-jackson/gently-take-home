import './AuthContainer.css';

import { Grid } from '@mui/material';
import { PropsWithChildren } from 'react';

// import LogoUrl from '../../../assets/logo.jpg';

export function AuthContainer({ children }: PropsWithChildren) {
  return (
    <div className="auth-container">
      <div className="auth-container-content">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <div className="auth-container-header">
              {/* <img alt="Logo" className="auth-container-image" src={LogoUrl} /> */}
              <h3 className="auth-container-title">Gently Take Home</h3>
              <h4 className="auth-container-warning">
                This system is for authorized users only. All sign-in attempts are monitored, and
                unauthorized access is strictly prohibited. Your IP address, device details, and
                login activity are recorded for security purposes.
              </h4>
            </div>
            <div className="auth-container-divider" />
          </Grid>
        </Grid>
        {children}
      </div>
    </div>
  );
}

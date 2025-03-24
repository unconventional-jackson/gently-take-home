import './NavigationLayout.css';

import { Book, Bookmarks, ExitToApp, Inventory } from '@mui/icons-material';
import { AppBar, Box, Tab, Tabs, Toolbar } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { PropsWithChildren, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { CustomButton } from '../components/Button/Button';
import { useAuth } from '../contexts/useAuth';
import { parseAxiosError } from '../utils/errors';

export function NavigationLayout({ children }: PropsWithChildren<unknown>) {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      queryClient.clear();
      localStorage.clear();
    } catch (error) {
      toast.error(`Failed to sign out: ${parseAxiosError(error)}`);
    }
  }, [queryClient, signOut]);

  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="navigation-layout-container">
      <div className="navigation-layout-page-body">
        <div className="navigation-layout-page-content">
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
              <Toolbar
                sx={{
                  justifyContent: 'space-between',
                }}
              >
                <Box />
                <Tabs value={selectedTab} centered textColor="inherit">
                  <Tab
                    label="Products"
                    iconPosition="start"
                    icon={<Inventory fontSize="small" />}
                    onClick={() => {
                      navigate('/app/products');
                      setSelectedTab(0);
                    }}
                  />
                  <Tab
                    label="Attributes"
                    iconPosition="start"
                    icon={<Bookmarks fontSize="small" />}
                    onClick={() => {
                      navigate('/app/attributes');
                      setSelectedTab(1);
                    }}
                  />
                  <Tab
                    label="Documentation"
                    iconPosition="start"
                    icon={<Book fontSize="small" />}
                    onClick={() => {
                      navigate('/app/documentation');
                      setSelectedTab(2);
                    }}
                  />
                </Tabs>
                <Box display="flex" columnGap="1rem">
                  <CustomButton
                    variant="text"
                    color="inherit"
                    startIcon={<ExitToApp fontSize="small" />}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </CustomButton>
                </Box>
              </Toolbar>
            </AppBar>
            {children}
          </Box>
        </div>
      </div>
    </div>
  );
}

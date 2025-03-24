import { Box, Container, Stack, useTheme } from '@mui/material';
import './MainContent.css';

import {
  PropsWithChildren,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useContext,
  createContext,
} from 'react';

interface MainContentProps {
  fullScreen?: boolean;
  tableOnly?: boolean;
}

type MainContentContextType = {
  height: number;
};

const MainContentContext = createContext<MainContentContextType>({
  height: 0,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useMainContentContext = () => {
  const context = useContext(MainContentContext);
  if (!context) {
    throw new Error('useMainContentContext must be used within a MainContent');
  }
  return context;
};

// Forward a ref
export const MainContent = forwardRef<HTMLDivElement, PropsWithChildren<MainContentProps>>(
  function MainContent({ children, fullScreen = false, tableOnly = false }, ref) {
    const theme = useTheme();

    // Get the rendered size of the box
    const boxRef = useRef<HTMLDivElement>(null);
    const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
      function updateSize() {
        const box = boxRef.current?.getBoundingClientRect();

        if (!box) {
          return;
        }
        setBoxSize({
          width: box.width, // - margin.left - margin.right,
          height: box.height, // - margin.top - margin.bottom,
        });
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Forward the ref to the parent
    useImperativeHandle(ref, () => {
      if (!boxRef.current) {
        throw new Error('boxRef is not initialized');
      }
      return boxRef.current;
    });

    return (
      <MainContentContext.Provider value={{ height: boxSize.height }}>
        <main
          data-testid="main-content"
          className="main-content"
          ref={boxRef}
          style={{ backgroundColor: theme.palette.grey[100] }}
        >
          <Box
            display="flex"
            height="100%"
            data-testid="main-content-container"
            style={{ backgroundColor: theme.palette.grey[100] }}
          >
            <Box
              data-testid="main-content-container-box"
              sx={{ width: '100%', backgroundColor: theme.palette.grey[100] }}
            >
              {fullScreen ? (
                children
              ) : tableOnly ? (
                <Container
                  data-testid="main-content-container-container"
                  sx={{
                    backgroundColor: theme.palette.grey[100],
                  }}
                  maxWidth="xl"
                >
                  {children}
                </Container>
              ) : (
                <Container
                  data-testid="main-content-container-container"
                  sx={{
                    backgroundColor: theme.palette.grey[100],
                    pt: 2,
                    pb: 2,
                  }}
                  maxWidth="lg"
                >
                  <Stack data-testid="main-content-container-stack" direction="column" spacing={2}>
                    {children}
                  </Stack>
                </Container>
              )}
            </Box>
          </Box>
        </main>
      </MainContentContext.Provider>
    );
  }
);

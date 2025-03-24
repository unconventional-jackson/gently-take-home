import { Box, Container, Divider, Grid, Typography } from '@mui/material';
import SwaggerJson from '@unconventional-jackson/gently-openapi-service/swagger.json';
import { useMemo } from 'react';
import SwaggerUI from 'swagger-ui-react';

import { MainContent } from '../../components/MainContent/MainContent';
import { PageLayout } from '../../components/PageLayout/PageLayout';
import { Config } from '../../config';

export function APIDocumentationPage() {
  const officialJsonWithUrl = useMemo(() => {
    if (Config.ENV === 'local') {
      return {
        ...SwaggerJson,
        servers: [
          {
            url: 'http://localhost:4000',
            description: 'Local API server',
          },
        ],
      };
    }
    if (Config.ENV === 'dev') {
      return {
        ...SwaggerJson,
        servers: [
          {
            url: 'https://api.dev.gentlytakehome.com',
            description: 'Development API server',
          },
        ],
      };
    }
    if (Config.ENV === 'prod') {
      return {
        ...SwaggerJson,
        servers: [
          {
            url: 'https://api.prod.gentlytakehome.com',
            description: 'Production API server',
          },
        ],
      };
    }
  }, []);
  return (
    <PageLayout>
      <MainContent>
        <Container>
          <Box p={3} padding={5} display="flex" justifyContent="space-between">
            <Grid container spacing={2}>
              <Grid item xs={12} display="flex" flexDirection="column" rowGap="1rem">
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
                >
                  API Documentation
                </Typography>
                <Typography variant="body2">
                  On this page you can review and test access to the Gently Take Home API. The API
                  allows you to fetch product and attribute information in bulk.
                </Typography>
                <Typography variant="body2">
                  In order to access the API, you must use a JWT as provided during the sign in
                  process as a <code>Bearer $TOKEN</code> in the Authorization header of your
                  requests.
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Divider />
          <Box p={3} padding={5} flex={1} overflow="scroll">
            <SwaggerUI spec={officialJsonWithUrl} />
          </Box>
        </Container>
      </MainContent>
    </PageLayout>
  );
}

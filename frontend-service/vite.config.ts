// eslint-disable
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// https://github.com/aws-amplify/amplify-js/issues/9639
export default defineConfig({
  plugins: [react()],
  ...(process.env.NODE_ENV === 'development'
    ? {
        define: {
          global: {},
        },
      }
    : {}),
  resolve: {
    alias: {
      ...(process.env.NODE_ENV !== 'development'
        ? {
            './runtimeConfig': './runtimeConfig.browser', //fix production build
          }
        : {}),
    },
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
  },
  build: {
    outDir: `./dist`,
  },
});

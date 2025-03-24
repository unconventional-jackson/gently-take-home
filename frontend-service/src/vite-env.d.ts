/// <reference types="vite/client" />

/**
 * https://vitejs.dev/guide/env-and-mode.html#env-files
 */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENV: 'local' | 'dev' | 'prod';
  readonly VITE_APPLICATION: 'gently';
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

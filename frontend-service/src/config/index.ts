interface ConfigVars {
  API_URL: string;
  ENV: 'local' | 'dev' | 'prod';
  CLIENT: string;
  SERVICE: string;
}

let apiUrl = 'http://localhost:4000';
let env: 'local' | 'dev' | 'prod' = 'local';
if (import.meta.env.MODE === 'dev') {
  apiUrl = 'https://api.dev.gentlytakehome.com';
  env = 'dev';
} else if (import.meta.env.MODE === 'prod') {
  apiUrl = 'https://api.prod.gentlytakehome.com';
  env = 'prod';
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Config: ConfigVars = {
  API_URL: apiUrl,
  ENV: env,
  CLIENT: import.meta.env.VITE_CLIENT as string,
  SERVICE: import.meta.env.VITE_SERVICE as string,
};

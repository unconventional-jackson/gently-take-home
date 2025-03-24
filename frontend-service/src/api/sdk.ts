/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  AuthUser,
  Configuration,
  DefaultApi,
  RefreshToken200Response,
} from '@unconventional-jackson/gently-openapi-service';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useMemo } from 'react';

import { version } from '../../package.json';
import { Config } from '../config';
import { queryClient } from './client';
if (!Config.API_URL) {
  throw new Error('Missing required environment variable: API_URL');
}

// Note, to test locally on mobile, use your ifconfig -a local LAN IP address, e.g. http://192.168.1.8:4000
const configuration = new Configuration({
  basePath: Config.API_URL,
});

export const api = new DefaultApi(configuration);

export function useSdk() {
  const apiSdk = useMemo(() => {
    if (!('axios' in api)) {
      throw new Error('The API SDK is missing the axios instance');
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    api.axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig<unknown>) => {
        if (config.url?.includes('auth')) {
          return config;
        }

        let localStorageUser = localStorage.getItem('user');
        if (
          localStorageUser === null ||
          localStorageUser === undefined ||
          localStorageUser === '' ||
          localStorageUser === 'null' ||
          localStorageUser === 'undefined'
        ) {
          localStorageUser = '{}';
        }
        const authUser = JSON.parse(localStorageUser) as AuthUser;

        const access_token = authUser?.access_token ?? '';
        config.headers['Authorization'] = `Bearer ${access_token}`;
        config.headers['x-app-version'] = version;
        return config;
      },
      async (error) => {
        return Promise.reject(error);
      }
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    api.axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async function (error: AxiosError) {
        if (!error.config?.url?.includes('auth')) {
          if (error?.response?.status === 401) {
            let localStorageUser = localStorage.getItem('user');
            if (
              localStorageUser === null ||
              localStorageUser === undefined ||
              localStorageUser === '' ||
              localStorageUser === 'null' ||
              localStorageUser === 'undefined'
            ) {
              localStorageUser = '{}';
            }
            const authUser = JSON.parse(localStorageUser) as AuthUser;

            const refresh_token = authUser?.refresh_token;
            try {
              const response = await axios.post<RefreshToken200Response>(
                `${Config.API_URL}/auth/refresh-token`,
                {
                  refresh_token,
                }
              );

              const { access_token } = response.data;
              localStorage.setItem(
                'user',
                JSON.stringify({
                  ...authUser,
                  access_token,
                })
              );

              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              return api.axios(error.config);
            } catch (err) {
              localStorage.removeItem('user');
              localStorage.clear();
              queryClient.clear();
              window.location.assign(window.location.origin);
              return Promise.reject(err);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return api;
  }, []);

  return apiSdk;
}

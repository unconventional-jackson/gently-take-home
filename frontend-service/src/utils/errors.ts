/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AxiosError } from 'axios';

export function parseAxiosError(error: unknown) {
  if (
    error instanceof AxiosError ||
    (typeof error === 'object' && error !== null && 'response' in error)
  ) {
    const maybeAxiosError = error as AxiosError;
    // @ts-ignore
    if (typeof maybeAxiosError.response?.data?.message === 'string') {
      // @ts-ignore
      return String(maybeAxiosError.response.data.message);
    }
    // @ts-ignore
    if (Array.isArray(maybeAxiosError.response?.data?.errors)) {
      // @ts-ignore
      return String(maybeAxiosError.response.data.errors.map((err: string) => err).join('\n'));
    }
    // @ts-ignore
    if (typeof maybeAxiosError.response?.data?.error === 'string') {
      // @ts-ignore
      return String(maybeAxiosError.response.data.error);
    }
    // @ts-ignore
    if (typeof maybeAxiosError.response?.data === 'string') {
      // @ts-ignore
      return String(maybeAxiosError.response?.data);
    }
    if (typeof maybeAxiosError.message === 'string') {
      return String(maybeAxiosError.message);
    }
    return 'Missing error metadata';
  }

  if (error instanceof Error) {
    return String(error.message);
  }
  return String(error);
}

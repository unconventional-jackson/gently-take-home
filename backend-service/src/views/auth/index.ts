import { Router } from 'express';
import asyncHandler from 'express-async-handler';

import { changePassword } from './changePassword';
import { forgotPassword } from './forgotPassword';
import { refreshToken } from './refreshToken';
import { resendVerification } from './resendVerification';
import { resetPassword } from './resetPassword';
import { signIn } from './signIn';
import { signUp } from './signUp';
import { totpSetup } from './totpSetup';
import { totpVerify } from './totpVerify';
import { verifyEmail } from './verifyEmail';

export const authRoutes = Router();

authRoutes.post('/signup', asyncHandler(signUp));
authRoutes.post('/signin', asyncHandler(signIn));
authRoutes.post('/forgot-password', asyncHandler(forgotPassword));
authRoutes.post('/reset-password', asyncHandler(resetPassword));
authRoutes.post('/change-password', asyncHandler(changePassword));
authRoutes.post('/verify-email', asyncHandler(verifyEmail));
authRoutes.post('/resend-verification', asyncHandler(resendVerification));
authRoutes.post('/totp/setup', asyncHandler(totpSetup));
authRoutes.post('/totp/verify', asyncHandler(totpVerify));
authRoutes.post('/refresh-token', asyncHandler(refreshToken));

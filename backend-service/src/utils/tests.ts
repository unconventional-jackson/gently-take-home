import { UserModel } from '@unconventional-jackson/gently-database-service';
import { TotpVerify200Response } from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import * as speakeasy from 'speakeasy';
import request from 'supertest';
import { v4 } from 'uuid';

export function getEmail(): string {
  return `test+${v4().slice(0, 8)}@unconventionalcode.com`;
}

export function getPassword(): string {
  const password = [];
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  password.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
  const uppercase = lowercase.toUpperCase();
  password.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
  const numbers = '0123456789';
  password.push(numbers[Math.floor(Math.random() * numbers.length)]);
  // [!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]
  const special = '!@#$%^&*()_+-=[]{};:\'"\\|,.<>/?';
  password.push(special[Math.floor(Math.random() * special.length)]);
  const all = lowercase + uppercase + numbers + special;

  while (password.length < 8) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }
  return password.join('');
}

export function getAttributeName(): string {
  return `test-attribute-${v4().slice(0, 8)}`;
}

export function getShortCode(): string {
  const lowercase = 'abcdef';
  const lowercaseLetter = lowercase[Math.floor(Math.random() * lowercase.length)];
  const additionalLength = Math.floor(Math.random() * 8) + 1;
  const uuid = v4().replace(/-/g, '').slice(0, additionalLength);
  return `${lowercaseLetter}${uuid}`;
}

export function getProductName(): string {
  return `test-product-${v4().slice(0, 8)}`;
}

export async function getUserAccessToken(app: Express) {
  // Prepare an Admin
  const email = getEmail();
  const password = getPassword();
  await request(app).post('/auth/signup').send({
    email,
    password,
  });
  const user = await UserModel.findOne({ where: { email } });
  const token = speakeasy.totp({
    secret: user?.auth_totp_secret ?? '',
    encoding: 'ascii',
    digits: 6,
  });
  await request(app).post('/auth/verify-email').send({
    email,
    token,
  });
  const totpVerifyresponse = await request(app).post('/auth/totp/verify').send({
    email,
    token,
  });
  return (totpVerifyresponse.body as TotpVerify200Response).user?.access_token ?? '';
}

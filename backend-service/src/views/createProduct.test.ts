import { Product } from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getProductName, getUserAccessToken } from '../utils/tests';

describe('POST /products', () => {
  let app: Express;
  let access_token: string;
  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendSendGridEmail, 'sendSendGridEmail').mockResolvedValue();
  });

  beforeEach(async () => {
    access_token = await getUserAccessToken(app);
  });

  describe('success cases', () => {
    describe('when valid properties are provided', () => {
      it('creates the product', async () => {
        const product_name = getProductName();
        const response = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name,
          });
        const product = response.body as Product;
        expect(response.status).toBe(201);
        expect(product.product_id).toEqual(expect.any(String));
        expect(product.product_name).toBe(product_name);
        expect(product.product_description).toBe(null);
        expect(product.created_at).toEqual(expect.any(String));
        expect(product.updated_at).toEqual(expect.any(String));
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const invalid_token = v4();
        const response = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${invalid_token}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the product_name is missing', () => {
      it('should return an HTTP 400 error', async () => {
        const response = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'product_name is required.' })
        );
      });
    });

    describe('when the product name is not unique', () => {
      it('should return an HTTP 500 error', async () => {
        const existing_product_name = getProductName();
        await request(app).post('/products').set('Authorization', `Bearer ${access_token}`).send({
          product_name: existing_product_name,
        });

        const response = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: existing_product_name,
          });

        expect(response.status).toBe(500);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'SequelizeUniqueConstraintError: Validation error' })
        );
      });
    });

    describe('when a product is created with missing is_required attributes', () => {
      it.todo('should return an HTTP 400 error');
      it.todo('should roll back the transaction and not create the product in the database');
    });
  });
});

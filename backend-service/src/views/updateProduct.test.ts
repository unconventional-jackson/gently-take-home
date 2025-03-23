import { Product } from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getProductName, getUserAccessToken } from '../utils/tests';

describe('PATCH /products/:product_id', () => {
  let app: Express;
  let access_token: string;
  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendSendGridEmail, 'sendSendGridEmail').mockResolvedValue();
  });

  let product_id: string;

  beforeEach(async () => {
    access_token = await getUserAccessToken(app);
    const createProductResponse = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        product_name: getProductName(),
      });
    const product = createProductResponse.body as Product;
    product_id = product.product_id as string;
  });

  describe('success cases', () => {
    describe('when a valid product is provided with at least one field to update', () => {
      it('updates the product', async () => {
        const response = await request(app)
          .patch(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });
        const product = response.body as Product;
        expect(response.status).toBe(200);
        expect(product.product_id).toEqual(expect.any(String));
      });
    });
    describe('when the product_name is updated', () => {
      it('updates the product_name', async () => {
        const original_product_name = getProductName();
        const original_product_description = v4();
        const updated_product_name = getProductName();
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: original_product_name,
            product_description: original_product_description,
          });
        const product = createProductResponse.body as Product;
        const response = await request(app)
          .patch(`/products/${product.product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: updated_product_name,
          });
        const updatedProduct = response.body as Product;
        expect(response.status).toBe(200);
        expect(updatedProduct.product_name).toEqual(updated_product_name);
        expect(updatedProduct.product_description).toEqual(original_product_description);
      });
    });

    describe('when the product_description is updated', () => {
      it('updates the product_description', async () => {
        const original_product_name = getProductName();
        const original_product_description = v4();
        const updated_product_description = v4();
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: original_product_name,
            product_description: original_product_description,
          });
        const product = createProductResponse.body as Product;
        const response = await request(app)
          .patch(`/products/${product.product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_description: updated_product_description,
          });
        const updatedProduct = response.body as Product;
        expect(response.status).toBe(200);
        expect(updatedProduct.product_name).toEqual(original_product_name);
        expect(updatedProduct.product_description).toEqual(updated_product_description);
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const invalid_token = v4();
        const response = await request(app)
          .patch(`/products/${product_id}`)
          .set('Authorization', `Bearer ${invalid_token}`)
          .send({
            product_name: getProductName(),
          });

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the product_id is for a non-existent product', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .patch(`/products/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Product not found' }));
      });
    });

    describe('when at least one of product_name or product_description is not provided', () => {
      it('should return an HTTP 400 error', async () => {
        const response = await request(app)
          .patch(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: '',
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
          expect.objectContaining({
            error: 'At least one of product_name or product_description is required.',
          })
        );
      });
    });
  });
});

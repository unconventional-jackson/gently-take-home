import { AttributeType } from '@unconventional-jackson/gently-database-service';
import {
  Attribute,
  Product,
  ProductAttributeLookup,
} from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getAttributeName, getProductName, getShortCode, getUserAccessToken } from '../utils/tests';

describe('GET /products/:product_id', () => {
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
    describe('when a valid product_id is provided', () => {
      it('returns the product', async () => {
        // Create a product
        const product_name = getProductName();
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name,
          });
        const createdProduct = createProductResponse.body as Product;
        const product_id = createdProduct.product_id;

        // Get the product
        const response = await request(app)
          .get(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`);
        const product = response.body as Product;
        expect(response.status).toBe(200);
        expect(product.product_id).toEqual(expect.any(String));
        expect(product.product_name).toBe(product_name);
        expect(product.product_description).toBe(null);
        expect(product.created_at).toEqual(expect.any(String));
        expect(product.updated_at).toEqual(expect.any(String));
      });
    });
    describe('when the product has a product attribute lookup', () => {
      it('should return the product attribute lookup on the product', async () => {
        // Create a product
        const product_name = getProductName();
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name,
          });
        const createdProduct = createProductResponse.body as Product;
        const product_id = createdProduct.product_id;

        // Create an attribute
        const attribute_name = getAttributeName();
        const createAttributeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name,
            attribute_type: AttributeType.STRING,
            short_code: getShortCode(),
            is_required: true,
          });
        const createdAttribute = createAttributeResponse.body as Attribute;
        const attribute_id = createdAttribute.attribute_id;

        // Create a product attribute lookup
        const createProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_id,
            attribute_value: 'test',
          });
        const createdProductAttributeLookup =
          createProductAttributeLookupResponse.body as ProductAttributeLookup;
        const product_attribute_lookup_id =
          createdProductAttributeLookup.product_attribute_lookup_id;

        // Get the product
        const response = await request(app)
          .get(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`);
        const product = response.body as Product;
        expect(response.status).toBe(200);
        expect(product.product_attribute_lookups?.length).toBe(1);
        expect(product.product_attribute_lookups?.[0].product_attribute_lookup_id).toBe(
          product_attribute_lookup_id
        );
        expect(product.product_attribute_lookups?.[0].attribute?.attribute_name).toBe(
          attribute_name
        );
        expect(product.product_attribute_lookups?.[0].attribute?.attribute_type).toBe(
          AttributeType.STRING
        );
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const invalid_token = v4();
        const response = await request(app)
          .get(`/products/${v4()}`)
          .set('Authorization', `Bearer ${invalid_token}`);

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the product does not exist', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .get(`/products/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Product not found.' }));
      });
    });
  });
});

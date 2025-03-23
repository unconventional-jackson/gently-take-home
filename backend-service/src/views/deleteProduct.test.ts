import {
  AttributeModel,
  ProductAttributeLookup,
  ProductAttributeLookupModel,
  ProductModel,
} from '@unconventional-jackson/gently-database-service';
import {
  Attribute,
  AttributeAttributeTypeEnum,
  Product,
} from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getAttributeName, getProductName, getShortCode, getUserAccessToken } from '../utils/tests';

describe('DELETE /products/:product_id', () => {
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
    describe('a valid product is provided', () => {
      it('deletes the product', async () => {
        // Create the product
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });
        const product = createProductResponse.body as Product;
        expect(product.product_id).toEqual(expect.any(String));
        const product_id = product.product_id;

        // Delete the product
        const deleteProductResponse = await request(app)
          .delete(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteProductResponse.status).toBe(200);

        // Verify that the product is deleted
        const originalProduct = await ProductModel.findByPk(product_id);
        expect(originalProduct).toBeNull();
      });
      it('deletes any product attribute lookups for the product', async () => {
        // Create a product
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });
        const product = createProductResponse.body as Product;
        expect(createProductResponse.status).toBe(201);
        expect(product.product_id).toEqual(expect.any(String));
        const product_id = product.product_id;

        // Create the attribute
        const createAttributeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: getShortCode(),
            is_required: true,
          });
        const attribute = createAttributeResponse.body as Attribute;
        expect(createAttributeResponse.status).toBe(201);
        expect(attribute.attribute_id).toEqual(expect.any(String));
        const attribute_id = attribute.attribute_id;

        // Add a product attribute lookup
        const addProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const productAttributeLookup =
          addProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(addProductAttributeLookupResponse.status).toBe(201);
        expect(productAttributeLookup.product_attribute_lookup_id).toEqual(expect.any(String));
        const product_attribute_lookup_id = productAttributeLookup.product_attribute_lookup_id;
        // Delete the product
        const deleteProductResponse = await request(app)
          .delete(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteProductResponse.status).toBe(200);

        // Verify that the product attribute lookup is deleted
        const originalProductAttributeLookup = await ProductAttributeLookupModel.findByPk(
          product_attribute_lookup_id
        );
        expect(originalProductAttributeLookup).toBeNull();
      });
      it('does not delete any base attribute definitions for attributes assigned to the deleted product', async () => {
        // Create a product
        const createProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });
        const product = createProductResponse.body as Product;
        expect(createProductResponse.status).toBe(201);
        expect(product.product_id).toEqual(expect.any(String));
        const product_id = product.product_id;

        // Create the attribute
        const createAttributeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: getShortCode(),
            is_required: true,
          });
        const attribute = createAttributeResponse.body as Attribute;
        expect(createAttributeResponse.status).toBe(201);
        expect(attribute.attribute_id).toEqual(expect.any(String));
        const attribute_id = attribute.attribute_id;

        // Add a product attribute lookup
        const addProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const productAttributeLookup =
          addProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(addProductAttributeLookupResponse.status).toBe(201);
        expect(productAttributeLookup.product_attribute_lookup_id).toEqual(expect.any(String));

        // Delete the product
        const deleteProductResponse = await request(app)
          .delete(`/products/${product_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteProductResponse.status).toBe(200);

        // Verify that the product itself is not deleted
        const originalAttribute = await AttributeModel.findByPk(attribute_id);
        expect(originalAttribute).not.toBeNull();
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const product_id = v4();
        const invalid_token = v4();
        const response = await request(app)
          .delete(`/products/${product_id}`)
          .set('Authorization', `Bearer ${invalid_token}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the product_id is for a non-existent product', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .delete(`/products/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Product not found' }));
      });
    });

    describe('when any other error occurs', () => {
      it('should return an HTTP 500 error', async () => {
        jest.spyOn(ProductModel, 'findByPk').mockRejectedValue(new Error('test'));
        const response = await request(app)
          .delete(`/products/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(500);
        expect(response.body).toEqual(
          expect.objectContaining({ error: String(new Error('test')) })
        );
      });
    });
  });
});

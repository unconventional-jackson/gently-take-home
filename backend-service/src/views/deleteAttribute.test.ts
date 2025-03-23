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

describe('DELETE /attributes/:attribute_id', () => {
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
    describe('a valid attribute is provided', () => {
      it('deletes the attribute', async () => {
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

        // Delete the attribute
        const deleteAttributeResponse = await request(app)
          .delete(`/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteAttributeResponse.status).toBe(200);

        // Verify that the attribute is deleted
        const originalAttribute = await AttributeModel.findByPk(attribute_id);
        expect(originalAttribute).toBeNull();
      });
      it('deletes any product attribute lookups for the attribute', async () => {
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
        // Delete the attribute
        const deleteAttributeResponse = await request(app)
          .delete(`/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteAttributeResponse.status).toBe(200);

        // Verify that the product attribute lookup is deleted
        const originalProductAttributeLookup = await ProductAttributeLookupModel.findByPk(
          product_attribute_lookup_id
        );
        expect(originalProductAttributeLookup).toBeNull();
      });
      it('does not delete any products that had the attribute assigned to them', async () => {
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

        // Delete the attribute
        const deleteAttributeResponse = await request(app)
          .delete(`/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteAttributeResponse.status).toBe(200);

        // Verify that the product itself is not deleted
        const originalProduct = await ProductModel.findByPk(product_id);
        expect(originalProduct).not.toBeNull();
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const attribute_id = v4();
        const invalid_token = v4();
        const response = await request(app)
          .delete(`/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${invalid_token}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the attribute_id is for a non-existent attribute', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .delete(`/attributes/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Attribute not found' }));
      });
    });

    describe('when the attribute_id targets multiple attributes', () => {
      it('should return an HTTP 500 error', async () => {
        // Note, this should never happen due to a primary key / unique constraint on attribute_id, so we need to explicitly mock the database call
        jest.spyOn(AttributeModel, 'destroy').mockResolvedValue(2);
        const response = await request(app)
          .delete(`/attributes/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(500);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'Multiple attributes deleted' })
        );
      });
    });

    describe('when any other error occurs', () => {
      it('should return an HTTP 500 error', async () => {
        jest.spyOn(AttributeModel, 'destroy').mockRejectedValue(new Error('test'));
        const response = await request(app)
          .delete(`/attributes/${v4()}`)
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

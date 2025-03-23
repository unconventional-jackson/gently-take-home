import {
  Attribute,
  AttributeAttributeTypeEnum,
  Product,
  ProductAttributeLookup,
} from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getAttributeName, getProductName, getShortCode, getUserAccessToken } from '../utils/tests';

describe('PATCH /products/:product_id/attributes/:attribute_id/:product_attribute_lookup_id', () => {
  let app: Express;
  let access_token: string;
  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendSendGridEmail, 'sendSendGridEmail').mockResolvedValue();
  });

  let product_id: string;
  let attribute_id: string;
  let product_attribute_lookup_id: string;

  beforeEach(async () => {
    access_token = await getUserAccessToken(app);

    // Create a product
    const createProductResponse = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        product_name: getProductName(),
      });
    const product = createProductResponse.body as Product;
    product_id = product.product_id as string;

    // Create a default attribute
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
    attribute_id = attribute.attribute_id as string;
  });

  describe('success cases', () => {
    describe('when a valid product attribute lookup is provided with a valid update', () => {
      it('updates the product attribute lookup', async () => {
        // Create an attribute
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
        attribute_id = attribute.attribute_id as string;

        // Create a product attribute lookup
        const original_attribute_value = v4();
        const updated_attribute_value = v4();
        const createProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: original_attribute_value,
          });
        const productAttributeLookup =
          createProductAttributeLookupResponse.body as ProductAttributeLookup;
        product_attribute_lookup_id = productAttributeLookup.product_attribute_lookup_id as string;

        // Update the product attribute lookup
        const response = await request(app)
          .patch(
            `/products/${product_id}/attributes/${attribute_id}/${product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: updated_attribute_value,
          });
        const updatedProductAttributeLookup = response.body as ProductAttributeLookup;
        expect(response.status).toBe(200);
        expect(updatedProductAttributeLookup.product_attribute_lookup_id).toEqual(
          product_attribute_lookup_id
        );
        expect(updatedProductAttributeLookup.attribute_value).toEqual(updated_attribute_value);
      });
    });
    describe('when the attribute is a boolean attribute', () => {
      it('should update a product attribute lookup with the provided boolean value', async () => {
        // Create a boolean attribute
        const createBooleanAttributeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.Boolean,
            short_code: getShortCode(),
            is_required: true,
          });
        const createBooleanAttribute = createBooleanAttributeResponse.body as Attribute;
        const booleanAttributeId = createBooleanAttribute.attribute_id as string;

        // Create a product attribute lookup with the value true
        const booleanTrueResponse = await request(app)
          .post(`/products/${product_id}/attributes/${booleanAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'true',
          });
        const productAttributeLookup = booleanTrueResponse.body as ProductAttributeLookup;
        expect(booleanTrueResponse.status).toBe(201);
        expect(productAttributeLookup.attribute_value).toBe('true');
        expect(productAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Boolean
        );

        // Update the product attribute lookup with the value false
        const booleanFalseResponse = await request(app)
          .patch(
            `/products/${product_id}/attributes/${booleanAttributeId}/${productAttributeLookup.product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'false',
          });
        const updatedProductAttributeLookup = booleanFalseResponse.body as ProductAttributeLookup;
        expect(booleanFalseResponse.status).toBe(200);
        expect(updatedProductAttributeLookup.attribute_value).toBe('false');
        expect(updatedProductAttributeLookup.attribute_value).not.toBe('true');
        expect(updatedProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Boolean
        );
      });
    });

    describe('when the attribute is a number attribute', () => {
      it('should update a product attribute lookup with the provided number value', async () => {
        // Create a number attribute
        const createNumberAttributeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.Number,
            short_code: getShortCode(),
            is_required: true,
          });
        const createNumberAttribute = createNumberAttributeResponse.body as Attribute;
        const numberAttributeId = createNumberAttribute.attribute_id as string;

        // Create a product attribute lookup with the value 123
        const createNumberProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${numberAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '123',
          });
        const integerProductAttributeLookup =
          createNumberProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(createNumberProductAttributeLookupResponse.status).toBe(201);
        expect(integerProductAttributeLookup.attribute_value).toBe('123');
        expect(integerProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Number
        );

        // Update the product attribute lookup with the value 123.45
        const updateNumberProductAttributeLookupResponse = await request(app)
          .patch(
            `/products/${product_id}/attributes/${numberAttributeId}/${integerProductAttributeLookup.product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '123.45',
          });
        const updatedProductAttributeLookup =
          updateNumberProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(updateNumberProductAttributeLookupResponse.status).toBe(200);
        expect(updatedProductAttributeLookup.attribute_value).toBe('123.45');
        expect(updatedProductAttributeLookup.attribute_value).not.toBe('123');
        expect(updatedProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Number
        );
      });
    });

    describe('when the attribute is a date attribute', () => {
      it('should update a product attribute lookup with the provided date (time) value (ISO 8601 string)', async () => {
        // Create a date attribute
        const createDateAttributeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.Date,
            short_code: getShortCode(),
            is_required: true,
          });
        const createDateAttribute = createDateAttributeResponse.body as Attribute;
        const dateAttributeId = createDateAttribute.attribute_id as string;

        // Create a product attribute lookup with the value 2021-01-01
        const createDateProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${dateAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '2021-01-01',
          });
        const dateProductAttributeLookup =
          createDateProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(createDateProductAttributeLookupResponse.status).toBe(201);
        expect(dateProductAttributeLookup.attribute_value).toBe('2021-01-01T00:00:00.000Z');
        expect(dateProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Date
        );

        // Update the product attribute lookup with the value 2021-01-01T00:00:00Z
        const updateDateProductAttributeLookupResponse = await request(app)
          .patch(
            `/products/${product_id}/attributes/${dateAttributeId}/${dateProductAttributeLookup.product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '2021-01-02T00:00:00Z',
          });
        const updatedProductAttributeLookup =
          updateDateProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(updateDateProductAttributeLookupResponse.status).toBe(200);
        expect(updatedProductAttributeLookup.attribute_value).toBe('2021-01-02T00:00:00.000Z');
        expect(updatedProductAttributeLookup.attribute_value).not.toBe('2021-01-01T00:00:00.000Z');
        expect(updatedProductAttributeLookup.attribute_value).not.toBe('2021-01-02');
        expect(updatedProductAttributeLookup.attribute_value).not.toBe('2021-01-01');
        expect(updatedProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Date
        );
      });
    });

    describe('when the attribute is a string attribute', () => {
      it('should update a product attribute lookup with the provided string value', async () => {
        // Note that the beforeEach function creates a string attribute for us already
        // Create a product attribute lookup with the value 'test'
        const createStringProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const productAttributeLookup =
          createStringProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(createStringProductAttributeLookupResponse.status).toBe(201);
        expect(productAttributeLookup.attribute_value).toBe('test');
        expect(productAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.String
        );

        // Update the product attribute lookup with the value 'test2'
        const updateStringProductAttributeLookupResponse = await request(app)
          .patch(
            `/products/${product_id}/attributes/${attribute_id}/${productAttributeLookup.product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test2',
          });
        const updatedProductAttributeLookup =
          updateStringProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(updateStringProductAttributeLookupResponse.status).toBe(200);
        expect(updatedProductAttributeLookup.attribute_value).toBe('test2');
        expect(updatedProductAttributeLookup.attribute_value).not.toBe('test');
        expect(updatedProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.String
        );
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
          .patch(`/products/${v4()}/attributes/${attribute_id}/${product_attribute_lookup_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Product not found' }));
      });
    });

    describe('when the attribute_id is for a non-existent attribute', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .patch(`/products/${product_id}/attributes/${v4()}/${product_attribute_lookup_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Attribute not found' }));
      });
    });

    describe('when the product_attribute_lookup_id is for a non-existent product attribute lookup', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .patch(`/products/${product_id}/attributes/${attribute_id}/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'Product attribute lookup not found' })
        );
      });
    });
  });
});

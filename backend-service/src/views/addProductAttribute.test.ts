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

describe('POST /products/:product_id/attributes/:attribute_id', () => {
  let app: Express;
  let access_token: string;
  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendSendGridEmail, 'sendSendGridEmail').mockResolvedValue();
  });

  let product_id: string;
  let attribute_id: string;
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
    describe('when valid properties are provided', () => {
      it('creates the product attribute lookup', async () => {
        const response = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const productAttributeLookup = response.body as ProductAttributeLookup;
        expect(response.body).toEqual(
          expect.objectContaining({
            attribute_value: 'test',
          })
        );
        expect(response.status).toBe(201);
        expect(productAttributeLookup.product_attribute_lookup_id).toEqual(expect.any(String));
        expect(productAttributeLookup.product_id).toBe(product_id);
        expect(productAttributeLookup.attribute_id).toBe(attribute_id);
        expect(productAttributeLookup.attribute_value).toBe('test');
      });
      it('should embed the original attribute in the response', async () => {
        const response = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const productAttributeLookup = response.body as ProductAttributeLookup;
        expect(productAttributeLookup.attribute?.attribute_id).toEqual(attribute_id);
      });
    });
    describe('when the product already has the attribute', () => {
      it('should allow creating multiple product attribute lookups in case the user wants to have multiple values for the same attribute', async () => {
        // Create the first product attribute lookup on this attribute_id
        const firstProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const firstProductAttributeLookup =
          firstProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(firstProductAttributeLookupResponse.status).toBe(201);
        expect(firstProductAttributeLookup.product_attribute_lookup_id).toEqual(expect.any(String));

        // Create the second product attribute lookup on this attribute_id
        const secondProductAttributeLookupResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test2',
          });
        const secondProductAttributeLookup =
          secondProductAttributeLookupResponse.body as ProductAttributeLookup;
        expect(secondProductAttributeLookupResponse.status).toBe(201);
        expect(secondProductAttributeLookup.product_attribute_lookup_id).toEqual(
          expect.any(String)
        );
      });
    });

    describe('when the attribute is a boolean attribute', () => {
      it('should create a product attribute lookup with the correct value', async () => {
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
        const booleanTrueProductAttributeLookup =
          booleanTrueResponse.body as ProductAttributeLookup;
        expect(booleanTrueResponse.status).toBe(201);
        expect(booleanTrueProductAttributeLookup.attribute_value).toBe('true');
        expect(booleanTrueProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Boolean
        );

        // Create a product attribute lookup with the value false
        const booleanFalseResponse = await request(app)
          .post(`/products/${product_id}/attributes/${booleanAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'false',
          });
        const booleanFalseProductAttributeLookup =
          booleanFalseResponse.body as ProductAttributeLookup;
        expect(booleanFalseResponse.status).toBe(201);
        expect(booleanFalseProductAttributeLookup.attribute_value).toBe('false');
        expect(booleanFalseProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Boolean
        );
      });
    });

    describe('when the attribute is a number attribute', () => {
      it('should create a product attribute lookup with the correct value', async () => {
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
        const integerResponse = await request(app)
          .post(`/products/${product_id}/attributes/${numberAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '123',
          });
        const integerProductAttributeLookup = integerResponse.body as ProductAttributeLookup;
        expect(integerResponse.status).toBe(201);
        expect(integerProductAttributeLookup.attribute_value).toBe('123');
        expect(integerProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Number
        );

        // Create a product attribute lookup with the value 123.45
        const floatResponse = await request(app)
          .post(`/products/${product_id}/attributes/${numberAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '123.45',
          });
        const floatProductAttributeLookup = floatResponse.body as ProductAttributeLookup;
        expect(floatResponse.status).toBe(201);
        expect(floatProductAttributeLookup.attribute_value).toBe('123.45');
        expect(floatProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Number
        );
      });
    });

    describe('when the attribute is a date attribute', () => {
      it('should create a product attribute lookup with the correct value (ISO 8601 string)', async () => {
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
        const dateResponse = await request(app)
          .post(`/products/${product_id}/attributes/${dateAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '2021-01-01',
          });
        const dateProductAttributeLookup = dateResponse.body as ProductAttributeLookup;
        expect(dateResponse.status).toBe(201);
        expect(dateProductAttributeLookup.attribute_value).toBe('2021-01-01T00:00:00.000Z');
        expect(dateProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Date
        );

        // Create a product attribute lookup with the value 2021-01-01T00:00:00Z
        const dateTimeResponse = await request(app)
          .post(`/products/${product_id}/attributes/${dateAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: '2021-01-01T00:00:00Z',
          });
        const dateTimeProductAttributeLookup = dateTimeResponse.body as ProductAttributeLookup;
        expect(dateTimeResponse.status).toBe(201);
        expect(dateTimeProductAttributeLookup.attribute_value).toBe('2021-01-01T00:00:00.000Z');
        expect(dateTimeProductAttributeLookup.attribute?.attribute_type).toBe(
          AttributeAttributeTypeEnum.Date
        );
      });
    });

    describe('when the attribute is a string attribute', () => {
      it('should create a product attribute lookup with the correct value', async () => {
        // Note that the beforeEach function creates a string attribute for us already
        // Create a product attribute lookup with the value 'test'
        const stringResponse = await request(app)
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });
        const stringProductAttributeLookup = stringResponse.body as ProductAttributeLookup;
        expect(stringResponse.status).toBe(201);
        expect(stringProductAttributeLookup.attribute_value).toBe('test');
        expect(stringProductAttributeLookup.attribute?.attribute_type).toBe(
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
          .post(`/products/${product_id}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${invalid_token}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the product cannot be found', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .post(`/products/${v4()}/attributes/${attribute_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Product not found' }));
      });
    });

    describe('when the attribute cannot be found', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .post(`/products/${product_id}/attributes/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'test',
          });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Attribute not found' }));
      });
    });

    describe('when the boolean attribute value is not a valid boolean', () => {
      it('should return an HTTP 400 error', async () => {
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

        const response = await request(app)
          .post(`/products/${product_id}/attributes/${booleanAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'invalid',
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'Invalid boolean attribute value' })
        );
      });
    });

    describe('when the number attribute value is not a valid number', () => {
      it('should return an HTTP 400 error', async () => {
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

        const response = await request(app)
          .post(`/products/${product_id}/attributes/${numberAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'invalid',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('when the date attribute value is not a valid date', () => {
      it('should return an HTTP 400 error', async () => {
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

        const response = await request(app)
          .post(`/products/${product_id}/attributes/${dateAttributeId}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_value: 'invalid',
          });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'Invalid date attribute value' })
        );
      });
    });
  });
});

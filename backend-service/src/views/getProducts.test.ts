import { AttributeType, ProductModel } from '@unconventional-jackson/gently-database-service';
import {
  Attribute,
  GetProductsResponse,
  Product,
} from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getAttributeName, getProductName, getShortCode, getUserAccessToken } from '../utils/tests';

describe('GET /products', () => {
  let app: Express;
  let access_token: string;
  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendSendGridEmail, 'sendSendGridEmail').mockResolvedValue();
  });

  beforeEach(async () => {
    access_token = await getUserAccessToken(app);

    // Pre-emptively delete any products
    await ProductModel.destroy({ where: {} });
  });

  describe('success cases', () => {
    describe('when no products exist', () => {
      it('returns an empty array', async () => {
        const response = await request(app)
          .get('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.objectContaining({ items: [], count: 0, limit: 10, offset: 0 })
        );
      });
    });
    describe('when products exist', () => {
      it('returns the products', async () => {
        // Create an product
        await request(app).post('/products').set('Authorization', `Bearer ${access_token}`).send({
          product_name: getProductName(),
        });

        const response = await request(app)
          .get('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const getProductsResponseBody = response.body as GetProductsResponse;
        expect(response.status).toBe(200);
        expect(getProductsResponseBody.items).toEqual(expect.arrayContaining([expect.any(Object)]));
        expect(getProductsResponseBody.count).toBeGreaterThanOrEqual(1);
        expect(getProductsResponseBody.limit).toBe(10);
        expect(getProductsResponseBody.offset).toBe(1);
      });
    });

    describe('when a limit is provided', () => {
      it('returns up to the limit number of products, but returns the full count', async () => {
        // Create an product

        for (let i = 0; i < 10; i++) {
          await request(app).post('/products').set('Authorization', `Bearer ${access_token}`).send({
            product_name: getProductName(),
          });
        }

        const response = await request(app)
          .get('/products?limit=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const getProductsResponseBody = response.body as GetProductsResponse;
        expect(response.status).toBe(200);
        expect(getProductsResponseBody.items.length).toBe(5);
        expect(getProductsResponseBody.count).toBe(10);
        expect(getProductsResponseBody.limit).toBe(5);
        expect(getProductsResponseBody.offset).toBe(5);
      });
    });

    describe('when an offset is provided', () => {
      it('returns the products from the offset', async () => {
        for (let i = 0; i < 10; i++) {
          await request(app).post('/products').set('Authorization', `Bearer ${access_token}`).send({
            product_name: getProductName(),
          });
        }

        // Only 5 products should be returned, since out of 10, we're offsetting by 5
        const response = await request(app)
          .get('/products?offset=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const getProductsResponseBody = response.body as GetProductsResponse;
        expect(response.status).toBe(200);
        expect(getProductsResponseBody.items.length).toBe(5);
        expect(getProductsResponseBody.count).toBe(10);
      });
      it('returns different products when the offset is changed via pagination, sorted by created_at descending to return newest products first', async () => {
        let product_ids: string[] = [];
        for (let i = 0; i < 10; i++) {
          const response = await request(app)
            .post('/products')
            .set('Authorization', `Bearer ${access_token}`)
            .send({
              product_name: getProductName(),
            });
          const product = response.body as Product;
          product_ids.push(product.product_id as string);
        }
        product_ids = product_ids.reverse();

        // Fetch the products with an offset of 0
        const firstPageResponse = await request(app)
          .get('/products?offset=0&limit=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const firstPageGetProductsResponseBody = firstPageResponse.body as GetProductsResponse;
        expect(firstPageResponse.status).toBe(200);
        expect(firstPageGetProductsResponseBody.items.length).toBe(5);
        expect(firstPageGetProductsResponseBody.count).toBe(10);
        const firstPageProductIds = firstPageGetProductsResponseBody.items.map(
          (item) => item.product_id
        );
        expect(firstPageProductIds).toEqual(expect.arrayContaining(product_ids.slice(0, 5)));

        // Fetch the products with an offset of 5
        const secondPageResponse = await request(app)
          .get('/products?offset=5&limit=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const secondPageGetProductsResponseBody = secondPageResponse.body as GetProductsResponse;
        expect(secondPageResponse.status).toBe(200);
        expect(secondPageGetProductsResponseBody.items.length).toBe(5);
        expect(secondPageGetProductsResponseBody.count).toBe(10);
        const secondPageProductIds = secondPageGetProductsResponseBody.items.map(
          (item) => item.product_id
        );
        expect(secondPageProductIds).toEqual(expect.arrayContaining(product_ids.slice(5, 10)));
      });
    });

    describe('when valid short_code filters are provided', () => {
      let expected_product_id: string;
      let unexpected_product_id: string;
      beforeEach(async () => {
        const createExpectedProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });
        const expectedProduct = createExpectedProductResponse.body as Product;
        expected_product_id = expectedProduct.product_id as string;

        const createUnexpectedProductResponse = await request(app)
          .post('/products')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            product_name: getProductName(),
          });
        const unexpectedProduct = createUnexpectedProductResponse.body as Product;
        unexpected_product_id = unexpectedProduct.product_id as string;
      });
      describe('eq - equal to', () => {
        describe('string attributes', () => {
          it('returns the products with attributes that explicitly match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'test',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'test2',
              });

            // test == test, so we expect test
            const response = await request(app)
              .get(`/products?${short_code}_eq=test`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('boolean attributes', () => {
          it('returns the products with attributes that explicitly match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.BOOLEAN,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'true',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'false',
              });

            // true == true, so we expect true
            const response = await request(app)
              .get(`/products?${short_code}_eq=true`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('number attributes', () => {
          it('returns the products with attributes that explicitly match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.NUMBER,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '1',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2',
              });

            // 1 == 1, so we expect 1
            const response = await request(app)
              .get(`/products?${short_code}_eq=1`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('date attributes', () => {
          it('returns the products with attributes that explicitly match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.DATE,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-01',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-02',
              });

            // 2021-01-01 == 2021-01-01, so we expect 2021-01-01
            const response = await request(app)
              .get(`/products?${short_code}_eq=2021-01-01`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
      });

      describe('ne - not equal to', () => {
        describe('string attributes', () => {
          it('returns the products with attributes that explicitly do NOT match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'test2',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'test',
              });

            // test2 != test, so we expect test2
            const response = await request(app)
              .get(`/products?${short_code}_ne=test`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('boolean attributes', () => {
          it('returns the products with attributes that explicitly do NOT match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.BOOLEAN,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'false',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'true',
              });

            // false != true, so we expect false
            const response = await request(app)
              .get(`/products?${short_code}_ne=true`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('number attributes', () => {
          it('returns the products with attributes that explicitly do NOT match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.NUMBER,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '1',
              });

            // 2 != 1, so we expect 2
            const response = await request(app)
              .get(`/products?${short_code}_ne=1`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('date attributes', () => {
          it('returns the products with attributes that explicitly do NOT match the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.DATE,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-02',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-01',
              });

            // 2021-01-02 != 2021-01-01, so we expect 2021-01-02
            const response = await request(app)
              .get(`/products?${short_code}_ne=2021-01-01`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
      });

      describe('gt - greater than', () => {
        describe('string attributes', () => {
          it('returns the products with attributes that are lexically greater than the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'b',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'a',
              });

            // b > a, so we expect b
            const response = await request(app)
              .get(`/products?${short_code}_gt=a`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('boolean attributes', () => {
          it.todo('gt is not relevant or tested for boolean attributes');
        });
        describe('string attributes', () => {
          it('returns the products with attributes that are numerically greater than the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '1',
              });

            // 2 > 1, so we expect 2
            const response = await request(app)
              .get(`/products?${short_code}_gt=1`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('date attributes', () => {
          it('returns the products with attributes that are chronologically after the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-02',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-01',
              });

            // 2021-01-02 > 2021-01-01, so we expect 2021-01-02
            const response = await request(app)
              .get(`/products?${short_code}_gt=2021-01-01`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
      });

      describe('gte - greater than or equal to', () => {});

      describe('lt - less than', () => {
        describe('string attributes', () => {
          it('returns the products with attributes that are lexically less than the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'a',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'b',
              });

            // a < b, so we expect a
            const response = await request(app)
              .get(`/products?${short_code}_lt=b`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('boolean attributes', () => {
          it.todo('lt is not relevant or tested for boolean attributes');
        });
        describe('string attributes', () => {
          it('returns the products with attributes that are numerically less than the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '1',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2',
              });

            // 2 > 1, so we expect 2
            const response = await request(app)
              .get(`/products?${short_code}_lt=2`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('date attributes', () => {
          it('returns the products with attributes that are chronologically before the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-01',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: '2021-01-02',
              });

            // 2021-01-02 > 2021-01-01, so we expect 2021-01-02
            const response = await request(app)
              .get(`/products?${short_code}_lt=2021-01-02`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
      });

      describe('lte - less than or equal to', () => {});

      describe('like - like', () => {
        describe('string attributes', () => {
          it('returns the products with attributes that are similar to the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'test',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'TEST',
              });

            // test like %test%, but not like %TEST%, so we expect test
            const response = await request(app)
              .get(`/products?${short_code}_like=%test%`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('boolean attributes', () => {
          it.todo('like is not relevant or tested for boolean attributes');
        });
        describe('number attributes', () => {
          it.todo('like is not relevant or tested for number attributes');
        });
        describe('date attributes', () => {
          it.todo('like is not relevant or tested for date attributes');
        });
      });

      describe('iLike - case insensitive like', () => {
        describe('string attributes', () => {
          it('returns the products with attributes that are case-insensitive similar to the short_code filter', async () => {
            const short_code = getShortCode();
            const createAttributeResponse = await request(app)
              .post('/attributes')
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_name: getAttributeName(),
                attribute_type: AttributeType.STRING,
                short_code,
                is_required: true,
              });
            const attribute = createAttributeResponse.body as Attribute;
            const attribute_id = attribute.attribute_id as string;

            // Create the attribute on the expected product
            await request(app)
              .post(`/products/${expected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'test',
              });

            // Create an attribute that will NOT match on the unexpected product
            await request(app)
              .post(`/products/${unexpected_product_id}/attributes/${attribute_id}`)
              .set('Authorization', `Bearer ${access_token}`)
              .send({
                attribute_value: 'NOTHING_ALIKE',
              });

            // test iLike %TEST%, so we expect test
            const response = await request(app)
              .get(`/products?${short_code}_iLike=TEST`)
              .set('Authorization', `Bearer ${access_token}`)
              .send();
            const getProductsResponseBody = response.body as GetProductsResponse;
            expect(response.status).toBe(200);
            expect(getProductsResponseBody.items.length).toBe(1);
            expect(getProductsResponseBody.items[0].product_id).toBe(expected_product_id);
            expect(getProductsResponseBody.items[0].product_id).not.toBe(unexpected_product_id);
          });
        });
        describe('boolean attributes', () => {
          it.todo('iLike is not relevant or tested for boolean attributes');
        });
        describe('number attributes', () => {
          it.todo('iLike is not relevant or tested for number attributes');
        });
        describe('date attributes', () => {
          it.todo('iLike is not relevant or tested for date attributes');
        });
      });

      describe.skip('is - is', () => {
        it.todo('is not yet implemented or supported');
      });
    });

    describe('failure cases', () => {
      describe('when a request is made with an invalid token', () => {
        it('should return an HTTP 401 error', async () => {
          const invalid_token = v4();
          const response = await request(app)
            .get('/products')
            .set('Authorization', `Bearer ${invalid_token}`)
            .send();

          expect(response.status).toBe(401);
          expect(response.body).toEqual(
            expect.objectContaining({ error: expect.any(String) as string })
          );
        });
      });

      describe('when any other error occurs', () => {
        it('should return an HTTP 500 error', async () => {
          jest.spyOn(ProductModel, 'findAll').mockRejectedValue(new Error('test'));
          const response = await request(app)
            .get('/products')
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
});

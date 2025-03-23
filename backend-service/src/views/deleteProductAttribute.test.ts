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

describe('DELETE /products/:product_id/attributes/:attribute_id/:product_attribute_lookup_id', () => {
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
    // Create the product
    const createProductResponse = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        product_name: getProductName(),
      });
    const product = createProductResponse.body as Product;
    expect(product.product_id).toEqual(expect.any(String));
    product_id = product.product_id as string;

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
    attribute_id = attribute.attribute_id as string;

    // Create the product attribute lookup
    const createProductAttributeLookupResponse = await request(app)
      .post(`/products/${product_id}/attributes/${attribute_id}`)
      .set('Authorization', `Bearer ${access_token}`)
      .send({
        attribute_value: 'test',
      });
    const productAttributeLookup =
      createProductAttributeLookupResponse.body as ProductAttributeLookup;
    expect(createProductAttributeLookupResponse.status).toBe(201);
    expect(productAttributeLookup.product_attribute_lookup_id).toEqual(expect.any(String));
    product_attribute_lookup_id = productAttributeLookup.product_attribute_lookup_id as string;
  });

  describe('success cases', () => {
    describe('a valid product, attribute, and product attribute lookup is provided', () => {
      it('deletes the product attribute lookup', async () => {
        // Delete the product attribute lookup
        const deleteProductAttributeResponse = await request(app)
          .delete(
            `/products/${product_id}/attributes/${attribute_id}/${product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteProductAttributeResponse.status).toBe(200);

        // Verify that the product attribute lookup is deleted
        const originalProductAttributeLookup = await ProductAttributeLookupModel.findByPk(
          product_attribute_lookup_id
        );
        expect(originalProductAttributeLookup).toBeNull();
      });

      it('should not delete the product itself', async () => {
        // Delete the product attribute lookup
        const deleteProductAttributeResponse = await request(app)
          .delete(
            `/products/${product_id}/attributes/${attribute_id}/${product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteProductAttributeResponse.status).toBe(200);

        // Verify that the product is not deleted
        const originalProduct = await ProductModel.findByPk(product_id);
        expect(originalProduct).not.toBeNull();
      });
      it('does not delete the attribute itself', async () => {
        // Delete the product attribute lookup
        const deleteProductAttributeResponse = await request(app)
          .delete(
            `/products/${product_id}/attributes/${attribute_id}/${product_attribute_lookup_id}`
          )
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(deleteProductAttributeResponse.status).toBe(200);

        // Verify that the attribute is not deleted
        const originalAttribute = await AttributeModel.findByPk(attribute_id);
        expect(originalAttribute).not.toBeNull();
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const invalid_token = v4();
        const response = await request(app)
          .delete(`/products/${v4()}/attributes/${v4()}/${v4()}`)
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
          .delete(`/products/${v4()}/attributes/${attribute_id}/${product_attribute_lookup_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Product not found' }));
      });
    });

    describe('when the attribute_id is for a non-existent attribute', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .delete(`/products/${product_id}/attributes/${v4()}/${product_attribute_lookup_id}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({ error: 'Attribute not found' }));
      });
    });

    describe('when the product_attribute_lookup_id is for a non-existent product attribute lookup', () => {
      it('should return an HTTP 404 error', async () => {
        const response = await request(app)
          .delete(`/products/${product_id}/attributes/${attribute_id}/${v4()}`)
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'Product attribute lookup not found' })
        );
      });
    });

    describe('when any other error occurs', () => {
      it('should return an HTTP 500 error', async () => {
        jest.spyOn(ProductAttributeLookupModel, 'findByPk').mockRejectedValue(new Error('test'));
        const response = await request(app)
          .delete(
            `/products/${product_id}/attributes/${attribute_id}/${product_attribute_lookup_id}`
          )
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

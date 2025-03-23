import { AttributeModel, AttributeType } from '@unconventional-jackson/gently-database-service';
import { Attribute, GetAttributesResponse } from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getAttributeName, getShortCode, getUserAccessToken } from '../utils/tests';

describe('GET /attributes', () => {
  let app: Express;
  let access_token: string;
  beforeAll(async () => {
    app = await main(true);
    jest.spyOn(SendSendGridEmail, 'sendSendGridEmail').mockResolvedValue();
  });

  beforeEach(async () => {
    access_token = await getUserAccessToken(app);

    // Pre-emptively delete any attributes
    await AttributeModel.destroy({ where: {} });
  });

  describe('success cases', () => {
    describe('when no attributes exist', () => {
      it('returns an empty array', async () => {
        const response = await request(app)
          .get('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.objectContaining({ items: [], count: 0, limit: 10, offset: 0 })
        );
      });
    });
    describe('when attributes exist', () => {
      it('returns the attributes', async () => {
        // Create an attribute
        await request(app).post('/attributes').set('Authorization', `Bearer ${access_token}`).send({
          attribute_name: getAttributeName(),
          attribute_type: AttributeType.STRING,
          short_code: getShortCode(),
          is_required: true,
        });

        const response = await request(app)
          .get('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const getAttributesResponseBody = response.body as GetAttributesResponse;
        expect(response.status).toBe(200);
        expect(getAttributesResponseBody.items).toEqual(
          expect.arrayContaining([expect.any(Object)])
        );
        expect(getAttributesResponseBody.count).toBeGreaterThanOrEqual(1);
        expect(getAttributesResponseBody.limit).toBe(10);
        expect(getAttributesResponseBody.offset).toBe(1);
      });
    });

    describe('when a limit is provided', () => {
      it('returns up to the limit number of attributes, but returns the full count', async () => {
        // Create an attribute

        for (let i = 0; i < 10; i++) {
          await request(app)
            .post('/attributes')
            .set('Authorization', `Bearer ${access_token}`)
            .send({
              attribute_name: getAttributeName(),
              attribute_type: AttributeType.STRING,
              short_code: getShortCode(),
              is_required: true,
            });
        }

        const response = await request(app)
          .get('/attributes?limit=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const getAttributesResponseBody = response.body as GetAttributesResponse;
        expect(response.status).toBe(200);
        expect(getAttributesResponseBody.items.length).toBe(5);
        expect(getAttributesResponseBody.count).toBe(10);
        expect(getAttributesResponseBody.limit).toBe(5);
        expect(getAttributesResponseBody.offset).toBe(5);
      });
    });

    describe('when an offset is provided', () => {
      it('returns the attributes from the offset', async () => {
        for (let i = 0; i < 10; i++) {
          await request(app)
            .post('/attributes')
            .set('Authorization', `Bearer ${access_token}`)
            .send({
              attribute_name: getAttributeName(),
              attribute_type: AttributeType.STRING,
              short_code: getShortCode(),
              is_required: true,
            });
        }

        // Only 5 attributes should be returned, since out of 10, we're offsetting by 5
        const response = await request(app)
          .get('/attributes?offset=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const getAttributesResponseBody = response.body as GetAttributesResponse;
        expect(response.status).toBe(200);
        expect(getAttributesResponseBody.items.length).toBe(5);
        expect(getAttributesResponseBody.count).toBe(10);
      });
      it('returns different attributes when the offset is changed via pagination, sorted by created_at descending to return newest attributes first', async () => {
        let attribute_ids: string[] = [];
        for (let i = 0; i < 10; i++) {
          const response = await request(app)
            .post('/attributes')
            .set('Authorization', `Bearer ${access_token}`)
            .send({
              attribute_name: getAttributeName(),
              attribute_type: AttributeType.STRING,
              short_code: getShortCode(),
              is_required: true,
            });
          const attribute = response.body as Attribute;
          attribute_ids.push(attribute.attribute_id as string);
        }
        attribute_ids = attribute_ids.reverse();

        // Fetch the attributes with an offset of 0
        const firstPageResponse = await request(app)
          .get('/attributes?offset=0&limit=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const firstPageGetAttributesResponseBody = firstPageResponse.body as GetAttributesResponse;
        expect(firstPageResponse.status).toBe(200);
        expect(firstPageGetAttributesResponseBody.items.length).toBe(5);
        expect(firstPageGetAttributesResponseBody.count).toBe(10);
        const firstPageAttributeIds = firstPageGetAttributesResponseBody.items.map(
          (item) => item.attribute_id
        );
        expect(firstPageAttributeIds).toEqual(expect.arrayContaining(attribute_ids.slice(0, 5)));

        // Fetch the attributes with an offset of 5
        const secondPageResponse = await request(app)
          .get('/attributes?offset=5&limit=5')
          .set('Authorization', `Bearer ${access_token}`)
          .send();
        const secondPageGetAttributesResponseBody =
          secondPageResponse.body as GetAttributesResponse;
        expect(secondPageResponse.status).toBe(200);
        expect(secondPageGetAttributesResponseBody.items.length).toBe(5);
        expect(secondPageGetAttributesResponseBody.count).toBe(10);
        const secondPageAttributeIds = secondPageGetAttributesResponseBody.items.map(
          (item) => item.attribute_id
        );
        expect(secondPageAttributeIds).toEqual(expect.arrayContaining(attribute_ids.slice(5, 10)));
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const invalid_token = v4();
        const response = await request(app)
          .get('/attributes')
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
        jest.spyOn(AttributeModel, 'findAll').mockRejectedValue(new Error('test'));
        const response = await request(app)
          .get('/attributes')
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

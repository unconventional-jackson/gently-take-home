import {
  Attribute,
  AttributeAttributeTypeEnum,
} from '@unconventional-jackson/gently-openapi-service';
import { Express } from 'express';
import request from 'supertest';
import { v4 } from 'uuid';

import { main } from '../app';
import * as SendSendGridEmail from '../services/sendSendGridEmail';
import { getAttributeName, getShortCode, getUserAccessToken } from '../utils/tests';

describe('POST /attributes', () => {
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
      it('creates the attribute', async () => {
        const attribute_name = getAttributeName();
        const short_code = getShortCode();
        const attribute_type = AttributeAttributeTypeEnum.String;
        const is_required = true;
        const response = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name,
            attribute_type,
            short_code,
            is_required,
          });
        const attribute = response.body as Attribute;
        expect(response.status).toBe(201);
        expect(attribute.attribute_id).toEqual(expect.any(String));
        expect(attribute.attribute_name).toBe(attribute_name);
        expect(attribute.attribute_description).toBe(null);
        expect(attribute.attribute_type).toBe(attribute_type);
        expect(attribute.short_code).toBe(short_code);
        expect(attribute.is_required).toBe(is_required);
      });
    });
  });

  describe('failure cases', () => {
    describe('when a request is made with an invalid token', () => {
      it('should return an HTTP 401 error', async () => {
        const invalid_token = v4();
        const response = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${invalid_token}`)
          .send();

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
          expect.objectContaining({ error: expect.any(String) as string })
        );
      });
    });

    describe('when the attribute_name is missing', () => {
      it('should return an HTTP 400 error', async () => {
        const response = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send();

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'attribute_name is required.' })
        );
      });
    });

    describe('when the attribute_type is missing or invalid', () => {
      it('should return an HTTP 400 error', async () => {
        const missingAttributeTypeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: undefined,
            short_code: getShortCode(),
            is_required: true,
          });

        expect(missingAttributeTypeResponse.status).toBe(400);
        expect(missingAttributeTypeResponse.body).toEqual(
          expect.objectContaining({ error: 'attribute_type is required.' })
        );

        const invalidAttributeTypeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: 'invalid',
            short_code: getShortCode(),
            is_required: true,
          });

        expect(invalidAttributeTypeResponse.status).toBe(400);
        expect(invalidAttributeTypeResponse.body).toEqual(
          expect.objectContaining({ error: 'attribute_type is required.' })
        );
      });
    });

    describe('when the short_code is missing or invalid', () => {
      it('should return an HTTP 400 error', async () => {
        const missingShortCodeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: undefined,
            is_required: true,
          });

        expect(missingShortCodeResponse.status).toBe(400);
        expect(missingShortCodeResponse.body).toEqual(
          expect.objectContaining({
            error:
              'short_code is required, must be 2-10 characters, alphanumeric, and lowercase, and start with a letter.',
          })
        );

        const invalidShortCodeResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: '123',
            is_required: true,
          });

        expect(invalidShortCodeResponse.status).toBe(400);
        expect(invalidShortCodeResponse.body).toEqual(
          expect.objectContaining({
            error:
              'short_code is required, must be 2-10 characters, alphanumeric, and lowercase, and start with a letter.',
          })
        );
      });
    });

    describe('when the is_required is missing or invalid', () => {
      it('should return an HTTP 400 error', async () => {
        const missingIsRequiredResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: getShortCode(),
            is_required: undefined,
          });

        expect(missingIsRequiredResponse.status).toBe(400);
        expect(missingIsRequiredResponse.body).toEqual(
          expect.objectContaining({ error: 'is_required is required.' })
        );

        const invalidIsRequiredResponse = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: getShortCode(),
            is_required: 'not a boolean',
          });

        expect(invalidIsRequiredResponse.status).toBe(400);
        expect(invalidIsRequiredResponse.body).toEqual(
          expect.objectContaining({ error: 'is_required is required.' })
        );
      });
    });

    describe('when the attribute name is not unique', () => {
      it('should return an HTTP 500 error', async () => {
        const existing_attribute_name = getAttributeName();
        await request(app).post('/attributes').set('Authorization', `Bearer ${access_token}`).send({
          attribute_name: existing_attribute_name,
          attribute_type: AttributeAttributeTypeEnum.String,
          short_code: getShortCode(),
          is_required: true,
        });

        const response = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: existing_attribute_name,
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: getShortCode(),
            is_required: true,
          });

        expect(response.status).toBe(500);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'SequelizeUniqueConstraintError: Validation error' })
        );
      });
    });

    describe('when the attribute short code is not unique', () => {
      it('should return an HTTP 500 error', async () => {
        const existing_short_code = getShortCode();
        await request(app).post('/attributes').set('Authorization', `Bearer ${access_token}`).send({
          attribute_name: getAttributeName(),
          attribute_type: AttributeAttributeTypeEnum.String,
          short_code: existing_short_code,
          is_required: true,
        });

        const response = await request(app)
          .post('/attributes')
          .set('Authorization', `Bearer ${access_token}`)
          .send({
            attribute_name: getAttributeName(),
            attribute_type: AttributeAttributeTypeEnum.String,
            short_code: existing_short_code,
            is_required: true,
          });

        expect(response.status).toBe(500);
        expect(response.body).toEqual(
          expect.objectContaining({ error: 'SequelizeUniqueConstraintError: Validation error' })
        );
      });
    });
  });
});

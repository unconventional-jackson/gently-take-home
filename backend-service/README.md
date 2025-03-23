# Gently Backend Service

## Overview

The Gently Backend Service is a RESTful API that provides a way to manage products and attributes. It is built with Node.js and Express.js and uses Sequelize as an ORM. Unit testing is less "unit" testing and more "in-memory end-to-end" testing, leveraging [supertest](https://www.npmjs.com/package/supertest) to emulate the Express API in-memory and [@shelf/jest-postgres](https://www.npmjs.com/package/@shelf/jest-postgres) to create a temporary PostgreSQL database for testing locally and build continuous integration tests.

The API specification is consumed from the [Gently OpenAPI Specification](../openapi-service/swagger.json). It is NOT used to artificially generate the Express API endpoints due to the complexity of managing custom business logic and validations in the endpoints, which makes code-generated _backend endpoints_ extremely brittle and difficult to maintain. However, the OpenAPI specification is used to generate the frontend API client, defined in the [frontend-service](../frontend-service) repository.

## Development

To run locally, you should install dependencies and start the server. Be sure that you have a valid AWS profile / credentials set up in your shell environment. Note that the backend **strictly requires** that the AWS Secrets Manager has a secret present as `/${stage}/gently/config`, as this secret contains both configuration and database credentials.

```bash
npm install
npm run start:local
```

Alternatively, the backend can be run jointly with the frontend and database using Docker Compose as described in the root [README](../README.md).

## Deployment

To deploy, a Docker image is built, pushed to AWS ECR, and then pulled and run in the target EC2 instance.

```bash
npm run deploy:dev
npm run deploy:prod
```

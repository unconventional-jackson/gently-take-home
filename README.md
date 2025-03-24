# Gently AI Founding Engineer Take Home

This repository contains all the services and applications necessary for the Gently AI take home.

## Overview

The project is a simple product catalog with a backend API and a frontend UI.

- `common-service` defines some shared types and utilities, nominally fetching configurations and secrets from AWS Secrets Manager.
- `openapi-service` defines a Swagger OpenAPI schema for the backend API.
- `database-service` is a set of Sequelize models and migration scripts for the PostgreSQL database. It also contains a Docker image to use for running migrations in-network against the database.
- `frontend-service` is a Vite React application that serves the UI. It also contains a Docker image to use for running the frontend in-network.
- `backend-service` is a Node.js application that serves the API. It also contains a Docker image to use for running the backend in-network.
- `infrastructure-service` is a CDK application that defines the infrastructure for the project.
- The root of the project defines some top-level scripts and a Docker Compose file for running the project locally and remotely.

## Schema Design

The schema is based on the EAV (Entity-Attribute-Value) pattern.

- Entities are the main objects in the schema.
- Attributes are the properties of entities.
- Values are the actual values of attributes.

This is a pretty standard pattern for dynamic attribute management. UDM (User Defined Metadata / Universal Data Model) and XML-based schemas are alternatives but end up being significantly more complex for little benefit and they do not scale.

The implementation here is extremely lightweight; we are just using:

- `Product` as the entity
- `Attribute` as the attribute, with a configured `AttributeType` supporting `string`, `number`, `boolean`, and `date`; we do not support `array` or `object` types, and we don't support customizing the field attributes (e.g. date format, numerical precision, string length / format, etc).
- `ProductAttributeLookup` as the value, with the pure, statically typed value in dedicated `value_string`, `value_number`, `value_boolean`, and `value_date` fields. However, to avoid loss of precision, the string-based `attribute_value` field is always used to transfer data dynamically across the client / server boundary, and the client UI / backend API use similar customized logic to parse and display the statically typed values.

### Filtering Products By Attributes

Look at the code and tests for `getProducts` to see how we filter products by attributes. In summary, we are using a concept of a `short_code` which is an HTTP URL-safe (no encoding necessary) string that is unique to an attribute, which can be passed with dynamic filter operators to query for products that match the attribute.

An example URL is `https://gentlytakehome.com/app/products?color_eq=angelus`. Assuming we have an attribute defined called `Color` (or anything really, as long as it has a `short_code` called `color`), this will infer that the `_eq` corresponds to an "equality" operator and thus we will filter the set of products to only those that have an attribute value of `angelus` for the `color` attribute.

## Development

1. Run `npm run start:local` to start the local development environment.
2. Run `npm run deploy:dev` to deploy the `dev` environment.
3. Run `npm run deploy:prod` to deploy the `prod` environment.

## Infrastructure Setup Speedrun

1. Have an AWS account up and running with 2FA. For best practices, have a separate workload account for development (`dev`) and production (`prod`) environments. For purposes of this project, only our own `dev` account is used, with separate deployments for the `dev` and `prod` environments.
2. Purchase a domain name on Route 53, nominally in the `prod` environment.
3. **Manually** create a hosted zone for `dev` subdomains in the `dev` workload.
4. **Manually** create NS records for the `dev` hosted zone in the `prod` workload TLD hosted zone.
5. Note, an existing VPC was already present in these workload accounts. It is reused rather than recreated for this project to mitigate costs.
6. Deploy infrastructure using CDK / CloudFormation.

## Fetching Products By Attributes

## Tech Stack

- AWS (infrastructure)
- Node.js (backend)
- React (frontend)
- PostgreSQL (database)
- Sequelize (ORM)
- Docker (local development + deployment)
- CDK (infrastructure-as-code)
- Vite (frontend)
- Supertest (end-to-end testing)
- Jest (unit / end-to-end testing)
- New Relic (logging, production)
- SendGrid (email)

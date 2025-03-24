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

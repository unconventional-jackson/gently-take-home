# Gently Frontend Service

## Overview

The Gently Frontend Service is a React application that provides a way to manage products and attributes. It is built with Vite and React and uses TypeScript.

## Development

To run locally, you should install dependencies and start the server.

```bash
npm install
npm run start:local
```

Alternatively, run the server in conjunction with the backend and database using Docker Compose as described in the root [README](../README.md).

## Deployment

To deploy, a Docker image is built, pushed to AWS ECR, and then pulled and run in the target EC2 instance.

```bash
npm run deploy:dev
npm run deploy:prod
```

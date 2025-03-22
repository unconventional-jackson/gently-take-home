# Gently OpenAPI Service

This folder contains the OpenAPI (Swagger) definition that generates the client SDKs for the Gently API.

## Publishing

For first-time publishing, manually run:

```sh
npm run generate
npm run build
npm publish --access public
```

For subsequent publishing, run:

```sh
npm run bump
```

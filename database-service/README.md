# Gently Database Service

This folder contains everything related to the database-service. We are running a Postgres database.

## Local Development

We are using Docker via Docker Compose to run the Postgres database.

## Development and Production Environments

We are using Postgres explicitly configured in an EC2 instance for development and production environments.

If we were interested in scaling this further, we could use AWS RDS (with its many flavors of instances, clusters, and serverless options).

If we were interested in scaling it to higher availability and be multi-cloud, we'd need to figure out how to run Postgres in multi-region, multi-cloud Kubernetes cluster(s), which is not something I've done yet.

## Publishing Models

The Sequelize models that we are using are defined in this service, for the purpose of keeping database models / schema changes tightly coupled with the migrations code.

This also encourages rigor in making future schema changes (since that is a major risk vector for production issues and bugs).

Thus, the models are intentionally version controlled both via Git and via explicit versioning of NPM packages. The NPM package versioning can't be downgraded manually without running down migrations up to the version desired, and the goal here was not to come up with a clever semantic-verioning migrations strategy (though, that would be cool). The goal was to introduce rigor and cognitive burden in making schema changes.

To publish a new version of the models, you can run the following command:

```bash
npm run build
npm publish --access public
```

For subsequent versions, you can just run the following command:

```bash
npm run bump
```

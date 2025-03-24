# Gently AI Founding Engineer Take Home

This repository contains all the services and applications necessary for the Gently AI take home.

## Infrastructure Setup Speedrun

1. Have an AWS account up and running with 2FA. For best practices, have a separate workload account for development (`dev`) and production (`prod`) environments. For purposes of this project, only our own `dev` account is used, with separate deployments for the `dev` and `prod` environments.
2. Purchase a domain name on Route 53, nominally in the `prod` environment.
3. **Manually** create a hosted zone for `dev` subdomains in the `dev` workload.
4. **Manually** create NS records for the `dev` hosted zone in the `prod` workload TLD hosted zone.
5. Note, an existing VPC was already present in these workload accounts. It is reused rather than recreated for this project to mitigate costs.
6. Deploy infrastructure using CDK / CloudFormation.

## Deploying

1. Run `npm run deploy:dev` to deploy the `dev` environment.
2. Run `npm run deploy:prod` to deploy the `prod` environment.

## Overview

The projec

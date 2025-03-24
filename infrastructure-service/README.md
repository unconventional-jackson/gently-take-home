# Domains Service

## Manual Infrastructure

### Root Domain

The root domain, `pileumsecurity.com`, was purchased in the Unconventional Code management (root) account. A Hosted Zone for `pileumsecurity.com` is present there as well.

### Hosted Zones

We manually created hosted zones in the workload accounts for `dev` and `prod`.

In `dev`, we have `dev.pileumsecurity.com`, and added an NS record with that Hosted Zone's nameservers in the management (root) account Hosted Zone. The `dev.pileumsecurity.com` Hosted Zone is used for all certificates, APIs, and client-side applications formatted as `service.dev.pileumsecurity.com`.

In `prod`, we have `prod.pileumsecurity.com` and `app.pileumsecurity.com` and `backoffice.pileumsecurity.com`. For each of these Hosted Zones, we added an NS record with their nameservers to the management (root) account Hosted Zone. The `prod.pileumsecurity.com` Hosted Zone is used for all certificates, APIs, and client-side applications formatted as `service.prod.pileumsecurity.com`. The `app.pileumsecurity.com` and `backoffice.pileumsecurity.com` are one-off Hosted Zones for the production versions of those client-facing apps (in other words, the development versions use the `dev.pileumsecurity.com` Hosted Zone to route traffic for `app.dev.pileumsecurity.com` and `backoffice.dev.pileumsecurity.com`, while the production versions are dedicated vanity URLs at `app.pileumsecurity.com` and `backoffice.pileumsecurity.com`). We additionally have `sentinel.pileumsecurity.com` for the same purposes.

The root DNS NS records for our Hosted Zones live with Pileum directly on DNSMadeEasy.

## Automated Infrastructure

CDK is used to deploy ACM Certificates for the various services and applications using the `pileumsecurity.com` domain. When deploying these certificates, DNS record validation is necessary. So, during the deploy step, when a new certificate is issued, view the certificate in the ACM console in the relevant workload account, and select the pending certificate, and select `Create Records in Route53`, and create the records. This only works if the Hosted Zone the certificate is issued via already exists in that workload account, and can only succeed in validating if the NS record for that Hosted Zone is present in the management (root) account Hosted Zone asserting domain ownership of the root `pileumsecurity.com` domain.

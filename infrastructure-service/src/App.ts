#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { CertificatesStack } from './stacks/CertificatesStack';
import { EC2Stack } from './stacks/EC2Stack';
import { ECRStack } from './stacks/ECRStack';

const stage = process.env.ENV;
if (!stage) {
  throw new Error('ENV is not set');
}
const account = '536060039117';
const region = 'us-east-1';

const app = new cdk.App();

const certificatesStack = new CertificatesStack(app, `${stage}-ue1-gently-certificates-stack`, {
  env: {
    region,
    account,
  },
  stage: stage ?? 'dev',
});

const ecrStack = new ECRStack(app, `${stage}-ue1-gently-ecr-stack`, {
  env: {
    region,
    account,
  },
  stage: stage ?? 'dev',
});

const ec2Stack = new EC2Stack(app, `${stage}-ue1-gently-ec2-stack`, {
  env: {
    region,
    account,
  },
  stage: stage ?? 'dev',
  backendCertificate: certificatesStack.backendCertificate,
  frontendCertificate: certificatesStack.frontendCertificate,
});
ecrStack.addDependency(certificatesStack);
ec2Stack.addDependency(ecrStack);

import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class CertificatesStack extends cdk.Stack {
  public readonly backendCertificate: acm.Certificate;
  public readonly frontendCertificate: acm.Certificate;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      stage: string;
    }
  ) {
    super(scope, id, props);

    const stage = props.stage ?? 'dev';
    const zone = route53.HostedZone.fromHostedZoneId(
      this,
      `${stage}-gently-hosted-zone`,
      'Z024771915XF70SE7FGOX'
    );

    /**
     * Create a certificate for the backend API
     */
    this.backendCertificate = new acm.Certificate(this, `${stage}-gently-backend-certificate`, {
      domainName: `api.${stage}.gentlytakehome.com`,
      certificateName: `${stage}-gently-backend-certificate`,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    /**
     * Create a certificate for the frontend
     */
    this.frontendCertificate = new acm.Certificate(this, `${stage}-gently-frontend-certificate`, {
      domainName: stage === 'prod' ? 'gentlytakehome.com' : `${stage}.gentlytakehome.com`,
      certificateName: `${stage}-gently-frontend-certificate`,
      validation: acm.CertificateValidation.fromDns(zone),
    });
  }
}

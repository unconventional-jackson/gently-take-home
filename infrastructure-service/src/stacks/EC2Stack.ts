import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export class EC2Stack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      stage: string;
      backendCertificate: acm.Certificate;
      frontendCertificate: acm.Certificate;
    }
  ) {
    super(scope, id, props);

    const stage = props.stage ?? 'dev';

    /**
     * Hard-coded VPC - we are only using a single AWS workload account / VPC for both dev and prod which is less-than-ideal, but deliberate as a cost savings measure
     */
    const vpcId = 'vpc-03c176b9b27c641ea';
    const vpc = ec2.Vpc.fromLookup(this, `${stage}-gently-vpc`, {
      vpcId,
    });
    /**
     * Note, manually created public subnet in AWS console
     */
    const privateSubnetA = 'subnet-0369db735049d5b56';

    /**
     * Note, manually created public subnet in AWS console
     */
    const publicSubnetA = 'subnet-01b715d103fcea6dd';

    /**
     * Note, manually created public subnet in AWS console
     */
    const publicSubnetB = 'subnet-015f3ccac1e8882aa';

    /**
     * Note, manually created key pair in AWS console
     */
    const keyName = `${stage}-ue1-gently-key-pair`;

    /**
     * Note, manually created hosted zone in AWS console
     */
    const hostedZoneId = 'Z024771915XF70SE7FGOX';
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, `${stage}-gently-hosted-zone`, {
      hostedZoneId,
      zoneName: 'gentlytakehome.com',
    });
    const backendCertificate = props.backendCertificate;
    const frontendCertificate = props.frontendCertificate;

    /**
     * Use the latest Ubuntu 24.04 AMI ID for us-east-1
     * https://cloud-images.ubuntu.com/locator/ec2/
     */
    const ubuntu2404AmiId = 'ami-084568db4383264d4';

    /**
     * Create a security group for the ALB
     * - Allow HTTP from anywhere
     * - Allow HTTPS from anywhere
     * - Allow PING from anywhere
     */
    const albSecurityGroup = new ec2.SecurityGroup(this, `${stage}-gently-alb-sg`, {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${stage}-gently-alb-sg`,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.icmpPing(),
      'Allow PING from anywhere'
    );

    /**
     * Create a security group for the API
     */
    const apiSecurityGroup = new ec2.SecurityGroup(this, `${stage}-gently-instance-sg`, {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${stage}-gently-instance-sg`,
    });
    apiSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(4000),
      'Allow HTTP / backend (API) traffic from ALB'
    );
    apiSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.HTTP,
      'Allow HTTP / frontend traffic from ALB'
    );
    apiSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.SSH,
      'Allow SSH from VPC CIDR (e.g. Bastion host)'
    );
    apiSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(4000),
      'Allow HTTP / backend (API) traffic from VPC CIDR (e.g. Bastion host)'
    );
    apiSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.HTTP,
      'Allow HTTP / frontend traffic from VPC CIDR (e.g. Bastion host)'
    );
    apiSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.icmpPing(),
      'Allow PING from VPC CIDR (e.g. Bastion host)'
    );
    apiSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.POSTGRES,
      'Allow Postgres from VPC CIDR (e.g. Bastion host)'
    );

    /**
     * Set up an IAM role for the instance with general managed policies and
     * critically, access to the config secret
     */
    const instanceRole = new iam.Role(this, `${stage}-gently-instance-role`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
    );
    instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly')
    );
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:ListSecrets'],
        resources: [
          `arn:aws:secretsmanager:${props.env?.region}:${props.env?.account}:secret:/${stage}/gently/config-??????`,
        ],
      })
    );

    /**
     * Our user data will allow us to use the AWS CLI to install docker and
     * configure the instance to run the docker container, as well as install postgres
     * and configure the database.
     */
    const userData = ec2.UserData.forLinux({
      shebang: '#!/bin/bash',
    });
    userData.addCommands(
      'apt update',
      // Install SSM Agent and AWS CLI
      'sudo apt install unzip',
      'apt install -y amazon-ssm-agent awscli',
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
      'unzip awscliv2.zip',
      'sudo ./aws/install',
      'systemctl enable amazon-ssm-agent', // original
      'systemctl start amazon-ssm-agent', // original
      // Install and configure Postgres
      // 'apt install -y postgresql postgresql-contrib',
      // 'echo "listen_addresses = \'*\'" >> /etc/postgresql/16/main/postgresql.conf',
      // 'systemctl enable postgres',
      // 'systemctl start postgres',
      // Install and configure Docker
      'apt install -y docker.io',
      'apt install -y docker-compose',
      'systemctl enable docker',
      'systemctl start docker',
      // Allow running docker without sudo
      'sudo usermod -aG docker ubuntu',
      'newgrp docker',
      // reboot for upgrade
      'sleep 15',
      'shutdown -r now'
    );

    const instance = new ec2.Instance(this, `${stage}-gently-instance`, {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.genericLinux({ 'us-east-1': ubuntu2404AmiId }),
      allowAllOutbound: true,
      instanceName: `${stage}-gently-instance`,
      keyPair: ec2.KeyPair.fromKeyPairName(this, `${stage}-gently-key-pair`, keyName),
      role: instanceRole,
      propagateTagsToVolumeOnCreation: true,
      securityGroup: apiSecurityGroup,
      userData,
      vpc,
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(this, `${stage}-gently-private-subnet-a`, {
            subnetId: privateSubnetA,
            availabilityZone: 'us-east-1a',
          }),
        ],
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(10, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // add tags to the instance
    cdk.Tags.of(instance).add('Name', `${stage}-gently-instance`);
    cdk.Tags.of(instance).add('Environment', stage);

    /**
     * Create an ALB to route traffic to the instance
     * - api.${stage}.gentlytakehome.com should route to port 4000 for the API
     * - ${stage}.gentlytakehome.com should route to port 80 for the frontend as raw files
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, `${stage}-gently-alb`, {
      vpc,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetId(this, `${stage}-gently-public-subnet-a`, publicSubnetA),
          ec2.Subnet.fromSubnetId(this, `${stage}-gently-public-subnet-b`, publicSubnetB),
        ],
      },
      internetFacing: true,
    });

    /**
     * Create a listener for HTTP to HTTPS upgrade
     */
    alb.addListener(`${stage}-gently-http-to-https-upgrade-listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: elbv2.ApplicationProtocol.HTTPS,
        permanent: false, // 302
        host: '#{host}',
        path: '/#{path}',
        query: '#{query}',
      }),
    });

    /**
     * Create an HTTPS listener on port 443 for both the backend and frontend
     */
    const httpsListener = alb.addListener(`${stage}-gently-https-listener`, {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [frontendCertificate, backendCertificate], // add both certs
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        messageBody: 'Not found',
        contentType: 'text/plain',
      }),
    });

    /**
     * Backend domain rule (api.${stage}.gentlytakehome.com -> port 4000)
     */
    httpsListener.addTargets(`${stage}-backend-rule`, {
      priority: 1,
      conditions: [elbv2.ListenerCondition.hostHeaders([`api.${stage}.gentlytakehome.com`])],
      port: 4000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [new targets.InstanceTarget(instance)],
      targetGroupName: `${stage}-gently-api-target-group`,
    });

    /**
     * Frontend domain rule (${stage}.gentlytakehome.com -> port 80)
     */
    httpsListener.addTargets(`${stage}-frontend-rule`, {
      priority: 2,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([
          stage === 'prod' ? 'gentlytakehome.com' : `${stage}.gentlytakehome.com`,
        ]),
      ],
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [new targets.InstanceTarget(instance)],
      targetGroupName: `${stage}-gently-frontend-target-group`.slice(0, 32),
    });

    /**
     * Create a Route 53 alias record for the API
     */
    new route53.ARecord(this, `${stage}-gently-api-alias-record`, {
      zone,
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(alb)),
      recordName: `api.${stage}.gentlytakehome.com`,
    });

    /**
     * Create a Route 53 alias record for the frontend
     */
    new route53.ARecord(this, `${stage}-gently-frontend-alias-record`, {
      zone,
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(alb)),
      recordName: stage === 'prod' ? 'gentlytakehome.com' : `${stage}.gentlytakehome.com`,
    });

    new cdk.CfnOutput(this, `${stage}-gently-instance-private-ip`, {
      value: instance.instancePrivateIp,
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class ECRStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      stage: string;
    }
  ) {
    super(scope, id, props);

    const stage = props.stage ?? 'dev';

    /**
     * Create an ECR repository for the backend API (since it runs in a Docker image)
     */
    new ecr.Repository(this, `${stage}-gently-backend-repository`, {
      repositoryName: `${stage}-gently-backend`,
      emptyOnDelete: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep only the last 10 images',
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    /**
     * Create an ECR repository for the frontend (since it runs in a Docker image)
     */
    new ecr.Repository(this, `${stage}-gently-frontend-repository`, {
      repositoryName: `${stage}-gently-frontend`,
      emptyOnDelete: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep only the last 10 images',
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    /**
     * Create an ECR repository for the migration (since it runs in a Docker image)
     */
    new ecr.Repository(this, `${stage}-gently-migration-repository`, {
      repositoryName: `${stage}-gently-migration`,
      emptyOnDelete: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: false,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep only the last 10 images',
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });
  }
}

SSH_PROFILE=prod-ue1-gently-instance
ENV=prod

# Assumes you have the AWS CLI installed and already have credentials set
echo $AWS_ACCOUNT_ID
echo $AWS_PROFILE
echo $AWS_REGION

echo "Deploying infrastructure..."
npm --prefix ./infrastructure-service run deploy:prod

echo "Adding SSH profile to ~/.ssh/config if it doesn't exist..."
if ! grep -q "$SSH_PROFILE" ~/.ssh/config; then
  # Add some newlines to the config file
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "# Gently Prod (SSH Jump via PJS Bastion)" >> ~/.ssh/config
  echo "Host $SSH_PROFILE" >> ~/.ssh/config
  echo "  HostName  $(aws cloudformation describe-stacks --stack-name prod-ue1-gently-ec2-stack --query "Stacks[0].Outputs[?OutputKey=='prodgentlyinstanceprivateip'].OutputValue" --output text)" >> ~/.ssh/config
  echo "  User ubuntu" >> ~/.ssh/config
  echo "  IdentityFile ~/.ssh/keys/gently/prod-ue1-gently-key-pair.pem" >> ~/.ssh/config
  echo "  ProxyJump dev-ue1-pjs-bastion" >> ~/.ssh/config
  # pjs is intentional here due to pre-existing VPC
fi


echo "Logging into ECR..."
# e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-repo
push_image() {
  IMAGE_NAME=$1
  DOCKERFILE_PATH=$2
  DOCKERFILE_CONTEXT=$3
  ECR_REPOSITORY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY > /dev/null
  # Use -q to quiet + output ID
  IMAGE_ID=$(docker build -q -t ${IMAGE_NAME} -f ${DOCKERFILE_PATH} ${DOCKERFILE_CONTEXT})
  IMAGE_HASH=$(echo ${IMAGE_ID} | cut -d':' -f2)
  ECR_IMAGE_TAG="${ECR_REPOSITORY}:${IMAGE_HASH}"
  docker tag ${IMAGE_ID} ${ECR_IMAGE_TAG} > /dev/null
  docker push $ECR_IMAGE_TAG > /dev/null
  echo $ECR_IMAGE_TAG
}

BACKEND_IMAGE_NAME=prod-gently-backend
FRONTEND_IMAGE_NAME=prod-gently-frontend
MIGRATION_IMAGE_NAME=prod-gently-migration
BACKEND_IMAGE_TAG=$(push_image "prod-gently-backend" "./backend-service/Dockerfile.prod" "./backend-service")
FRONTEND_IMAGE_TAG=$(push_image "prod-gently-frontend" "./frontend-service/Dockerfile.prod" "./frontend-service")
MIGRATION_IMAGE_TAG=$(push_image "prod-gently-migration" "./database-service/Dockerfile.prod" "./database-service")

echo "Copying docker-compose.prod.yml to EC2 instance..."
scp ./docker-compose.prod.yml $SSH_PROFILE:/home/ubuntu/gently/docker-compose.prod.yml


ssh $SSH_PROFILE << EOF
  cd gently
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$BACKEND_IMAGE_NAME
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$FRONTEND_IMAGE_NAME
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$MIGRATION_IMAGE_NAME

  echo "Taking down existing containers..."
  AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID} \
  AWS_REGION=${AWS_REGION} \
  BACKEND_IMAGE_TAG=${BACKEND_IMAGE_TAG} \
  FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE_TAG} \
  MIGRATION_IMAGE_TAG=${MIGRATION_IMAGE_TAG} \
  docker-compose -f docker-compose.prod.yml down -v || true

  echo "Starting new containers..."
  AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID} \
  AWS_REGION=${AWS_REGION} \
  BACKEND_IMAGE_TAG=${BACKEND_IMAGE_TAG} \
  FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE_TAG} \
  MIGRATION_IMAGE_TAG=${MIGRATION_IMAGE_TAG} \
  docker-compose -f docker-compose.prod.yml --verbose up --build -d
EOF
echo "Done!"
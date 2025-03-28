SSH_PROFILE=dev-ue1-gently-instance
ENV=dev

# Assumes you have the AWS CLI installed and already have credentials set
echo $AWS_ACCOUNT_ID
echo $AWS_PROFILE
echo $AWS_REGION

echo "Deploying infrastructure..."
npm --prefix ./infrastructure-service run deploy:dev

echo "Adding SSH profile to ~/.ssh/config if it doesn't exist..."
if ! grep -q "$SSH_PROFILE" ~/.ssh/config; then
  # Add some newlines to the config file
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "" >> ~/.ssh/config
  echo "# Gently Dev (SSH Jump via PJS Bastion)" >> ~/.ssh/config
  echo "Host $SSH_PROFILE" >> ~/.ssh/config
  echo "  HostName  $(aws cloudformation describe-stacks --stack-name dev-ue1-gently-ec2-stack --query "Stacks[0].Outputs[?OutputKey=='devgentlyinstanceprivateip'].OutputValue" --output text)" >> ~/.ssh/config
  echo "  User ubuntu" >> ~/.ssh/config
  echo "  IdentityFile ~/.ssh/keys/gently/dev-ue1-gently-key-pair.pem" >> ~/.ssh/config
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

BACKEND_IMAGE_NAME=dev-gently-backend
FRONTEND_IMAGE_NAME=dev-gently-frontend
MIGRATION_IMAGE_NAME=dev-gently-migration
BACKEND_IMAGE_TAG=$(push_image "dev-gently-backend" "./backend-service/Dockerfile.dev" "./backend-service")
FRONTEND_IMAGE_TAG=$(push_image "dev-gently-frontend" "./frontend-service/Dockerfile.dev" "./frontend-service")
MIGRATION_IMAGE_TAG=$(push_image "dev-gently-migration" "./database-service/Dockerfile.dev" "./database-service")

echo "Copying docker-compose.dev.yml to EC2 instance..."
scp ./docker-compose.dev.yml $SSH_PROFILE:/home/ubuntu/gently/docker-compose.dev.yml


ssh $SSH_PROFILE << EOF
  mkdir -p gently
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
  docker-compose -f docker-compose.dev.yml down -v || true

  echo "Starting new containers..."
  AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID} \
  AWS_REGION=${AWS_REGION} \
  BACKEND_IMAGE_TAG=${BACKEND_IMAGE_TAG} \
  FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE_TAG} \
  MIGRATION_IMAGE_TAG=${MIGRATION_IMAGE_TAG} \
  docker-compose -f docker-compose.dev.yml --verbose up --build -d
EOF
echo "Done!"
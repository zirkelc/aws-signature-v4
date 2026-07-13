#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayTestStack } from '../lib/api-gateway-test-stack.js';
import { LambdaTestStack } from '../lib/lambda-test-stack.js';

const app = new cdk.App();

new ApiGatewayTestStack(app, 'ApiGatewayTestStack', {
  env: {
    region: 'us-east-1',
  },
});

new LambdaTestStack(app, 'LambdaTestStack', {
  env: {
    region: 'us-east-1',
  },
});

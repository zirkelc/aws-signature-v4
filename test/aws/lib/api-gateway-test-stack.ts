import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import type { Construct } from 'constructs';

export const SERVICE = 'execute-api';
export const REGION = 'us-east-1';
export const STAGE = 'test';
export const API_NAME = 'aws-sigv4';
export const RESPONSE = { foo: 'bar' };
export const RESOURCE = 'mock';

export interface ApiGatewayTestStackProps extends cdk.StackProps {}

export class ApiGatewayTestStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiGatewayTestStackProps) {
    super(scope, id, props);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'TestApi', {
      restApiName: API_NAME,
      description: 'aws-sigv4: Mock REST API for testing with IAM authentication',
      deployOptions: {
        stageName: STAGE,
      },
    });

    // Create /mock resource
    const mockResource = this.api.root.addResource(RESOURCE);

    // Create /mock/{proxy+} resource for handling all sub-paths
    const proxyResource = mockResource.addProxy();

    // Helper to add mock integration
    const addMockIntegration = (resource: apigateway.IResource) => {
      const integration = new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify(RESPONSE),
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      });

      const methodResponse: apigateway.MethodResponse = {
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      };

      // Add GET method
      resource.addMethod('GET', integration, {
        methodResponses: [methodResponse],
        authorizationType: apigateway.AuthorizationType.IAM,
      });

      // Add POST method
      resource.addMethod('POST', integration, {
        methodResponses: [methodResponse],
        authorizationType: apigateway.AuthorizationType.IAM,
      });
    };

    // Add methods to both /mock and /mock/{proxy+}
    addMockIntegration(mockResource);
    addMockIntegration(proxyResource);

    // Add stack output for API URL
    this.apiUrl = this.api.url;
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });
  }
}

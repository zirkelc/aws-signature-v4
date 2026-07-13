import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type { Construct } from 'constructs';

export const SERVICE = 'lambda';
export const REGION = 'us-east-1';
export const FUNCTION_NAME = 'aws-sigv4-test';
export const RESPONSE = { foo: 'bar' };

export interface LambdaTestStackProps extends cdk.StackProps {}

export class LambdaTestStack extends cdk.Stack {
  public readonly lambdaFunction: lambda.Function;
  public readonly functionUrl: string;

  constructor(scope: Construct, id: string, props: LambdaTestStackProps) {
    super(scope, id, props);

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'TestFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(${JSON.stringify(RESPONSE)})
          };
        };
      `),
      functionName: FUNCTION_NAME,
    });

    // Add function URL with IAM auth
    const functionUrl = this.lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
    });

    // Store the function URL
    this.functionUrl = functionUrl.url;

    // Add stack output for Function URL
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL',
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import * as CrossSheetsApp from '../lib/cross-sheets-app-stack';

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CrossSheetsApp.CrossSheetsAppStack(app, 'MyTestStack');
  // THEN

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::DynamoDB::Table', 3);
  template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
});

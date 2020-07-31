import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway'
import * as path from 'path';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { CfnOutput, Duration } from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline'

export class ServerlessTicketTrackerStack extends cdk.Stack {
  public readonly urlOutput: CfnOutput;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'TicketsTable', {
      tableName: 'SttTickets',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    const api = new apigateway.RestApi(this, 'TicketsApi');
    const ticket = api.root.addResource('ticket');
    
    const getTicketHandler = new lambda.Function(this, 'GetTicket', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/tickets-get'),
      environment: {
        TABLE_NAME: table.tableName
      },
      timeout: Duration.seconds(30)
    });
    table.grantReadData(getTicketHandler);
    ticket.addMethod('GET', new apigateway.LambdaIntegration(getTicketHandler))

    const postTicketHandler = new lambda.Function(this, 'TicketsPost', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/tickets-post'),
      environment: {
        TABLE_NAME: table.tableName
      },
      timeout: Duration.seconds(30)
    });
    table.grantWriteData(postTicketHandler);
    ticket.addMethod('POST', new apigateway.LambdaIntegration(postTicketHandler))

    const health = api.root.addResource('health');
    const healthCheckHandler = new lambda.Function(this, 'HealthCheck', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/health-check'),
      environment: {
        TABLE_NAME: table.tableName
      },
      timeout: Duration.seconds(30)
    });
    table.grantReadData(healthCheckHandler);
    health.addMethod('GET', new apigateway.LambdaIntegration(healthCheckHandler))

    this.urlOutput = new CfnOutput(this, 'Url', {
      value: api.url
    });
  }
}
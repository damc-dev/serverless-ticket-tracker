
import { CfnOutput, Stage, Construct, StageProps } from '@aws-cdk/core';
import { ServerlessTicketTrackerStack } from './serverless-ticket-tracker-stack';

export class ServerlessTicketTrackerStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new ServerlessTicketTrackerStack(this, 'ServerlessTicketTracker', {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    });
    
    this.urlOutput = service.urlOutput;
  }
}
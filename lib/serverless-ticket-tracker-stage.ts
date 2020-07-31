
import { CfnOutput, Stage, Construct, StageProps } from '@aws-cdk/core';
import { ServerlessTicketTrackerStack } from './serverless-ticket-tracker-stack';

export class ServerlessTicketTrackerStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const service = new ServerlessTicketTrackerStack(this, 'ServerlessTicketTracker');
    
    this.urlOutput = service.urlOutput;
  }
}
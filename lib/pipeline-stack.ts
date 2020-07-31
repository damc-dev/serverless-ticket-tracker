import * as cdk from '@aws-cdk/core';
import { StackProps, Construct, SecretValue } from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines'
import { ServerlessTicketTrackerStack } from './serverless-ticket-tracker-stack';
import { ServerlessTicketTrackerStage } from './serverless-ticket-tracker-stage';

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        const sourceArtifact = new codepipeline.Artifact();
        const cloudAssemblyArtifact = new codepipeline.Artifact();

        const pipeline = new CdkPipeline(this, 'Pipeline', {
          pipelineName: 'ServerlessTicketTrackerPipeline',
          cloudAssemblyArtifact,
    
          sourceAction: new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub',
            output: sourceArtifact,
            oauthToken: SecretValue.secretsManager('github-token'),
            trigger: codepipeline_actions.GitHubTrigger.POLL,
            owner: 'damc-dev',
            repo: 'serverless-ticket-tracker',
          }),
    
          synthAction: SimpleSynthAction.standardYarnSynth({
            sourceArtifact,
            cloudAssemblyArtifact,
            buildCommand: 'yarn build',
          }),
        });
        pipeline.addApplicationStage(new ServerlessTicketTrackerStage(this, 'PreProd', {
            env: { account: '342431730723', region: 'us-east-1' }
          }));
    }
}
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ServerlessTicketTrackerStack } from '../lib/serverless-ticket-tracker-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new PipelineStack(app, 'ServerlessTicketTrackerPipelineStack');

import { SynthUtils } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as ServerlessTicketTracker from '../lib/serverless-ticket-tracker-stack';

test('Stack Snapshot', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new ServerlessTicketTracker.ServerlessTicketTrackerStack(app, 'MyTestStack');
    // THEN
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

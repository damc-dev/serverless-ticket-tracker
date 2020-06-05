# Serverless Ticket Tracker

This is an adaption of the WildRydes serverless ticketing workshop for my own personal use and of course built with CDK!

# Local Testing

## Local API Gateway
Local testing of lambda's can be done use AWS SAM

Build the lambdas

```
yarn build
```

Generate the template.yaml

```
yarn sam-template
```

Start local DynamoDB
```
docker network create sam-network
yarn start-db
```

Start local API Gateway

```
yarn start-api
```

## Local Lambda Invocation
Build the lambdas

```
yarn build
```

Generate the template.yaml

```
yarn sam-template
```

The find the logical id of the lambda you want to invoke in the template.yaml and invoke with sam

```
echo '{}' | sam local invoke ticketsGet57CD6353
```

## Useful commands

 * `yarn build`   compile typescript to js
 * `yarn watch`   watch for changes and compile
 * `yarn test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

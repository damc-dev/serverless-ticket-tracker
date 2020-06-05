import { Context, Handler, APIGatewayEvent } from 'aws-lambda';
import * as AWS from "aws-sdk"

const table = process.env.TABLE_NAME || 'SttTickets';
const endpoint = process.env.AWS_SAM_LOCAL ? "http://dynamodb:8000/" : undefined;
console.log(`Connecting to ${table} at endpoint: ${endpoint}`)

export const handler: Handler = async (event = {}, context: Context): Promise<any> => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    if (!event.body) {
        throw new Error("Recieved Event with no body")
    }
    let body = JSON.parse(event.body);

    const docClient = new AWS.DynamoDB.DocumentClient({
        endpoint
    });

    const params = {
        TableName: table, //we get table name from env variable.
        Item: {
            "id": new Date().toISOString(),
            "description": body.description,
            "assigned": body.assigned,
            "priority": body.priority,
            "status": body.status,
            "createdBy": body.createdBy,
            "createdOn": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        }
    };

    console.log("Adding a new ticket..." + JSON.stringify(params));

    try {
        const data = await docClient.put(params).promise();
        console.log("Added ticket:", JSON.stringify(data, null, 2));

        return {
            statusCode: '200',
            headers: {
                "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
            },
            body: JSON.stringify(params.Item)
        };
    } catch (err) {
        console.error("Unable to add ticket. Error JSON:", JSON.stringify(err, null, 2));
        return {
            statusCode: '500',
            body: 'Unable to add ticket'
        }
    }
}
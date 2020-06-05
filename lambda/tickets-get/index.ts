import { Context, Handler } from 'aws-lambda';
import * as AWS from "aws-sdk"

const table = process.env.TABLE_NAME || 'SttTickets';
const endpoint = process.env.AWS_SAM_LOCAL ? "http://dynamodb:8000/" : undefined;
console.log(`Connecting to ${table} at endpoint: ${endpoint}`)

export const handler: Handler = async(event = {}, context: Context): Promise<any> => {
    const docClient = new AWS.DynamoDB.DocumentClient({
        endpoint
    });

    const params = {
        TableName: table
    };

    const tickets = await docClient.scan(params).promise()
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(tickets)
    };

}
import {APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {GroupModel} from "./models/group-model";

import {v4 as uuidv4} from 'uuid';
import {ErrorMessage} from "./models/error-message";

const GROUPS_TABLE_NAME = process.env.GROUPS_TABLE_NAME;

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const documentClient = DynamoDBDocument.from(dynamoClient);


export const createHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    const group = JSON.parse(event.body as string) as GroupModel;
    group.id = uuidv4();


    const scanResult = await documentClient.scan({
        TableName: GROUPS_TABLE_NAME,
        Select: 'COUNT',
        FilterExpression: 'g_name = :group_name',
        ExpressionAttributeValues: {
            ':group_name': group.g_name
        }
    });
    const total = scanResult.Count;
    if (total) {
        return {
            statusCode: 409,
            body: JSON.stringify(new ErrorMessage(`Group name [${group.g_name}] already exists (count: ${total})`))
        };
    }

    const result = await documentClient.put({
        TableName: GROUPS_TABLE_NAME,
        Item: group
    });
    return {
        statusCode: 200,
        body: JSON.stringify(group)
    };
};

export const listHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    console.log("A request was received", event);
    console.log("With context: ", context);
    const responseObject = {
        action: "list",
    }
    return {
        statusCode: 200,
        body: JSON.stringify(responseObject)
    };
};

export const getHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    console.log("A request was received", event);
    console.log("With context: ", context);
    const responseObject = {
        action: "get",
    }
    return {
        statusCode: 200,
        body: JSON.stringify(responseObject)
    };
};

export const updateHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    console.log("A request was received", event);
    console.log("With context: ", context);
    const responseObject = {
        action: "update",
    }
    return {
        statusCode: 200,
        body: JSON.stringify(responseObject)
    };
};

export const deleteHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    console.log("A request was received", event);
    console.log("With context: ", context);
    const responseObject = {
        action: "remove",
    }
    return {
        statusCode: 200,
        body: JSON.stringify(responseObject)
    };
};
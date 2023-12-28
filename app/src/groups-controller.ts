import {APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {GroupModel} from "./models/group-model";

import {v4 as uuidv4} from 'uuid';
import {ErrorMessage} from "./models/error-message";
import {GroupsDao} from "./dao/groups-dao";

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const documentClient = DynamoDBDocument.from(dynamoClient);

const groupsDao = new GroupsDao(documentClient);

export const createHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    const group = JSON.parse(event.body as string) as GroupModel;
    group.id = uuidv4();


    if (!groupsDao.checkGroupName(group)) {
        return {
            statusCode: 409,
            body: JSON.stringify(new ErrorMessage(`Group name [${group.g_name}] already exists`))
        };
    }

    groupsDao.insert(group);

    return {
        statusCode: 200,
        body: JSON.stringify(group)
    };
};

export const listHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    const result = await groupsDao.list();

    return {
        statusCode: 200,
        body: JSON.stringify(result)
    };
};

export const getHandler: APIGatewayProxyHandler = async (event, context): Promise<APIGatewayProxyResult> => {
    const id = event.pathParameters?.id as string;
    const groupModel = await groupsDao.getById(id);
    if (groupModel) {
        return {
            statusCode: 200,
            body: JSON.stringify(groupModel)
        };
    }
    return {
        statusCode: 404,
        body: JSON.stringify(new ErrorMessage(`Group [${id}] not found`))
    }
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
    const id = event.pathParameters?.id as string;

    const deletedGroup = await groupsDao.delete(id);
    if (deletedGroup) {
        return {
            statusCode: 200,
            body: JSON.stringify(deletedGroup)
        };
    }
    return {
        statusCode: 422,
        body: JSON.stringify(new ErrorMessage(`Entity [${id}] not found`))
    }
};
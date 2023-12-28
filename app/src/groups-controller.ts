import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {GroupsDao} from "./dao/groups-dao";
import {CrudHandlers} from "./base-handlers/crud-handlers";
import {GroupModel} from "./models/group-model";

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const documentClient = DynamoDBDocument.from(dynamoClient);

const groupsDao = new GroupsDao(documentClient);

const crudHandlers = new CrudHandlers<GroupModel>(groupsDao, 'g_name', 'Group');

export const {
    createHandler,
    getHandler,
    deleteHandler,
    listHandler,
    updateHandler
} = crudHandlers.getHandlers();
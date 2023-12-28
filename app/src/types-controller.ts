import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {CrudHandlers} from "./base-handlers/crud-handlers";
import {TypesDao} from "./dao/types-dao";
import {TypeModel} from "./models/type-model";

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const documentClient = DynamoDBDocument.from(dynamoClient);

const typesDao = new TypesDao(documentClient);

const crudHandlers = new CrudHandlers<TypeModel>(typesDao, 't_name', 'Type');

export const {
    createHandler,
    getHandler,
    deleteHandler,
    listHandler,
    updateHandler
} = crudHandlers.getHandlers();
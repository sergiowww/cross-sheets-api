import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {BenchmarksDao} from "./dao/benchmarks-dao";
import {BenchmarkModel} from "./models/benchmark-model";
import {APIGatewayProxyHandler} from "aws-lambda";
import {ErrorMessage} from "./models/error-message";
import {GroupsDao} from "./dao/groups-dao";
import {defaultHandlersFactory} from "./base-handlers/default-handlers-factory";


const handlers = defaultHandlersFactory<BenchmarkModel>(
    documentClient => new BenchmarksDao(documentClient),
    'b_name',
    'Benchmark'
);

async function validateForeignKeys(model: BenchmarkModel, documentClient: DynamoDBDocument) {
    const groupsDao = new GroupsDao(documentClient);
    if (!await groupsDao.exists(model.id_group)) {
        return {
            statusCode: 422,
            body: JSON.stringify(new ErrorMessage(`Group [${model.id_group}] could not be found`))
        };
    }
    return null;
}

export const createHandler: APIGatewayProxyHandler = async (event, context) => {
    return handlers.createHandlerValidation(event, context, validateForeignKeys);

}

export const updateHandler: APIGatewayProxyHandler = async (event, context) => {
    return handlers.updateHandlerValidation(event, context, validateForeignKeys);

}

export const {
    getHandler,
    deleteHandler,
    listHandler,
} = handlers;
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {BenchmarksDao} from "./dao/benchmarks-dao";
import {CrudHandlers} from "./base-handlers/crud-handlers";
import {BenchmarkModel} from "./models/benchmark-model";
import {APIGatewayProxyHandler} from "aws-lambda";
import {ErrorMessage} from "./models/error-message";
import {GroupsDao} from "./dao/groups-dao";

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION
});

const documentClient = DynamoDBDocument.from(dynamoClient);

const benchmarksDao = new BenchmarksDao(documentClient);

const groupDao = new GroupsDao(documentClient);

const crudHandlers = new CrudHandlers<BenchmarkModel>(benchmarksDao, 'b_name', 'Benchmark');

async function validateForeignKeys(model: BenchmarkModel) {
    if (!await groupDao.exists(model.id_group)) {
        return {
            statusCode: 422,
            body: JSON.stringify(new ErrorMessage(`Group [${model.id_group}] could not be found`))
        };
    }
    return null;
}

export const createHandler: APIGatewayProxyHandler = async (event, context) => {
    return crudHandlers.createHandlerValidation(event, context, validateForeignKeys);

}

export const updateHandler: APIGatewayProxyHandler = async (event, context) => {
    return crudHandlers.updateHandlerValidation(event, context, validateForeignKeys);

}

export const {
    getHandler,
    deleteHandler,
    listHandler,
} = crudHandlers.getHandlers();
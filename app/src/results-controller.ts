import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {BenchmarksDao} from "./dao/benchmarks-dao";
import {
    APIGatewayEventDefaultAuthorizerContext,
    APIGatewayProxyEventBase,
    APIGatewayProxyHandler,
    APIGatewayProxyResult
} from "aws-lambda";
import {ErrorMessage} from "./models/error-message";
import {ResultModel} from "./models/result-model";
import {ResultsDao} from "./dao/results-dao";
import {daoBuilderCredentials, DaoFactory, defaultHandlersFactory} from "./base-handlers/default-handlers-factory";
import {CrudHandlers} from "./base-handlers/crud-handlers";
import {CognitoJwtPayload} from "./models/cognito-jwt-payload";


const daoFactory: DaoFactory<ResultModel> = (documentClient, userData) => new ResultsDao(documentClient, userData);
const handlers = defaultHandlersFactory<ResultModel>(
    daoFactory,
    'id_benchmark',
    'Results');

async function validateForeignKeys(model: ResultModel, documentClient: DynamoDBDocument, userData: CognitoJwtPayload): Promise<APIGatewayProxyResult | null> {
    const benchmarksDao = new BenchmarksDao(documentClient, userData);
    const benchmarkModel = await benchmarksDao.getById(model.id_benchmark);
    if (!benchmarkModel) {
        return {
            statusCode: 422,
            body: JSON.stringify(new ErrorMessage(`Benchmark [${model.id_benchmark}] could not be found`))
        };
    }
    const wodType = benchmarkModel.wod_type.toLowerCase();

    const resultPrefix = 'result_';
    const requiredProperty = `${resultPrefix}${wodType}`;
    // @ts-ignore
    const expectedResult = model[requiredProperty];
    if (!expectedResult) {
        return {
            statusCode: 400,
            body: JSON.stringify(new ErrorMessage(`I was expecting the ${requiredProperty} to be present as the wod type is ${benchmarkModel.wod_type}...`))
        }
    }
    Object.keys(model)
        .filter(value => value.startsWith(resultPrefix))
        .filter(value => value !== requiredProperty)
        .forEach(value => {
            // @ts-ignore
            model[value] = null;
        });

    return null;
}

function getAuthenticatedCrudHandlers(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>) {
    const dao = daoBuilderCredentials(event, daoFactory);
    return new CrudHandlers<ResultModel>(
        dao,
        'id_benchmark',
        'Results',
        dao.documentClient
    );
}

export const createHandler: APIGatewayProxyHandler = async (event, context) => {
    return handlers.createHandlerValidation(event, context, validateForeignKeys);
};
export const updateHandler: APIGatewayProxyHandler = async (event, context) => {
    return handlers.updateHandlerValidation(event, context, validateForeignKeys);
};

export const getHandler: APIGatewayProxyHandler = async (event, context) => {
    const crudHandlers = getAuthenticatedCrudHandlers(event);
    return crudHandlers.getHandler(event, context);
};

export const listHandler: APIGatewayProxyHandler = async (event, context) => {
    const crudHandlers = getAuthenticatedCrudHandlers(event);
    return crudHandlers.listHandler(event, context);
};

export const {
    deleteHandler,
} = handlers;
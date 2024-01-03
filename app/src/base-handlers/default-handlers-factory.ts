import {IdEntity} from "../models/id-entity";
import {BaseDao} from "../dao/base-dao";
import {
    APIGatewayEventDefaultAuthorizerContext,
    APIGatewayProxyEventBase,
    APIGatewayProxyHandler,
    Context
} from "aws-lambda";
import {Credentials, STS} from "@aws-sdk/client-sts";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {CrudHandlers, ValidationCallback} from "./crud-handlers";
import {jwtDecode} from "jwt-decode";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";

function getJwtPayload(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>): CognitoJwtPayload {
    const [, bearerContent] = (event.headers['Authorization'] as string).split(' ');
    return jwtDecode<CognitoJwtPayload>(bearerContent);
}

type DaoFactory<E extends IdEntity> = (documentClient: DynamoDBDocument) => BaseDao<E>;

type APIGatewayProxyHandlerValidation<E extends IdEntity> = (event: APIGatewayProxyEvent, context: Context, validationCallback: ValidationCallback<E>) => Promise<APIGatewayProxyResult>;


function daoBuilderGeneric<E extends IdEntity>(daoFactory: DaoFactory<E>): BaseDao<E> {
    const dynamoClient = new DynamoDBClient({
        region: process.env.AWS_REGION,
    });

    const documentClient = DynamoDBDocument.from(dynamoClient);
    return daoFactory(documentClient);
}

function daoBuilderCredentials<E extends IdEntity>(credentials: Credentials, daoFactory: DaoFactory<E>): BaseDao<E> {
    const dynamoClient = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: credentials.AccessKeyId as string,
            secretAccessKey: credentials.SecretAccessKey as string,
            sessionToken: credentials.SessionToken as string,
            expiration: credentials.Expiration
        }
    });

    const documentClient = DynamoDBDocument.from(dynamoClient);

    return daoFactory(documentClient);
}

async function assumeRole(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>, sts: STS) {
    const requestId = event.requestContext.requestId;
    const jwtPayload = getJwtPayload(event);
    const assumeRoleCommandOutput = await sts.assumeRole({
        RoleArn: jwtPayload["cognito:preferred_role"],
        RoleSessionName: `${jwtPayload["cognito:username"]}-${requestId.substring(0, 4)}-session`
    });
    return assumeRoleCommandOutput.Credentials as Credentials;
}

export function defaultHandlersFactory<E extends IdEntity>(
    daoFactory: DaoFactory<E>,
    nameProperty: keyof E,
    entityName: string
): {
    createHandler: APIGatewayProxyHandler,
    createHandlerValidation: APIGatewayProxyHandlerValidation<E>,
    listHandler: APIGatewayProxyHandler,
    getHandler: APIGatewayProxyHandler,
    updateHandler: APIGatewayProxyHandler,
    updateHandlerValidation: APIGatewayProxyHandlerValidation<E>,
    deleteHandler: APIGatewayProxyHandler
} {
    const sts = new STS({
        region: process.env.AWS_REGION
    });


    return {
        createHandler: async (event, context) => {
            const credentials = await assumeRole(event, sts);
            const dao = daoBuilderCredentials(credentials, daoFactory)
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.createHandler(event, context);
        },
        createHandlerValidation: async (event, context, validationCallback: ValidationCallback<E>) => {
            const credentials = await assumeRole(event, sts);
            const dao = daoBuilderCredentials(credentials, daoFactory)
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.createHandlerValidation(event, context, validationCallback);
        },
        deleteHandler: async (event, context) => {
            const credentials = await assumeRole(event, sts);
            const dao = daoBuilderCredentials(credentials, daoFactory)
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.deleteHandler(event, context);
        },
        getHandler: (event, context) => {
            const dao = daoBuilderGeneric(daoFactory);
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.getHandler(event, context);
        },
        listHandler: (event, context) => {
            const dao = daoBuilderGeneric(daoFactory);
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.listHandler(event, context);
        },
        updateHandlerValidation: async (event, context, validationCallback) => {
            const credentials = await assumeRole(event, sts);
            const dao = daoBuilderCredentials(credentials, daoFactory)
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.updateHandlerValidation(event, context, validationCallback);
        },
        updateHandler: async (event, context) => {
            const credentials = await assumeRole(event, sts);
            const dao = daoBuilderCredentials(credentials, daoFactory)
            const crudHandlers = new CrudHandlers<E>(
                dao,
                nameProperty,
                entityName,
                dao.documentClient
            );
            return crudHandlers.updateHandler(event, context);
        }
    }
}
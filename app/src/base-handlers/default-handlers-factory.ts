import {IdEntity} from "../models/id-entity";
import {BaseDao} from "../dao/base-dao";
import {
    APIGatewayEventDefaultAuthorizerContext,
    APIGatewayProxyEventBase,
    APIGatewayProxyHandler,
    Context
} from "aws-lambda";
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {CrudHandlers, ValidationCallback} from "./crud-handlers";
import {jwtDecode} from "jwt-decode";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {CognitoIdentityClient} from "@aws-sdk/client-cognito-identity";
import {fromCognitoIdentityPool} from "@aws-sdk/credential-provider-cognito-identity";
import {
    CognitoIdentityCredentialProvider
} from "@aws-sdk/credential-provider-cognito-identity/dist-types/fromCognitoIdentity";

function getJwtPayload(bearerContent: string): CognitoJwtPayload {
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

function daoBuilderCredentials<E extends IdEntity>(credentials: CognitoIdentityCredentialProvider, daoFactory: DaoFactory<E>): BaseDao<E> {
    const dynamoClient = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: credentials
    });

    const documentClient = DynamoDBDocument.from(dynamoClient);

    return daoFactory(documentClient);
}

function getBearerToken(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>) {
    const [, bearerContent] = (event.headers['Authorization'] as string).split(' ');
    return bearerContent;
}

function getCognitoCredentials(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>): CognitoIdentityCredentialProvider {
    const bearerContent = getBearerToken(event);
    const jwtPayload = getJwtPayload(bearerContent);
    const issuerName = process.env.ISSUER_NAME as string;
    const cognitoIdentityClient = new CognitoIdentityClient({
        region: process.env.AWS_REGION,
    });
    return fromCognitoIdentityPool({
        client: cognitoIdentityClient,
        identityPoolId: process.env.IDENTITY_POOL_ID as string,
        userIdentifier: jwtPayload.email,
        logins: {
            [issuerName]: bearerContent
        }
    });
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
    return {
        createHandler: async (event, context) => {
            const credentials = getCognitoCredentials(event);
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
            const credentials = getCognitoCredentials(event);
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
            const credentials = getCognitoCredentials(event);
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
            const credentials = getCognitoCredentials(event);
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
            console.log('eventt', event);
            console.log('contextt', context);
            const jwtPayload = getJwtPayload(getBearerToken(event));

            console.log('payload', jwtPayload);

            const credentials = getCognitoCredentials(event);
            const dao = daoBuilderCredentials(credentials, daoFactory);
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
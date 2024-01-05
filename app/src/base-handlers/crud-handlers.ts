import {
    APIGatewayEventDefaultAuthorizerContext,
    APIGatewayProxyEventBase,
    APIGatewayProxyResult,
    Context
} from "aws-lambda";
import {APIGatewayProxyEvent} from "aws-lambda/trigger/api-gateway-proxy";
import {BaseDao} from "../dao/base-dao";
import {IdEntity} from "../models/id-entity";
import {ErrorMessage} from "../models/error-message";
import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {AccessDeniedException} from "@aws-sdk/client-account";
import {getJwtPayloadFromEvent} from "../utils/token-utils";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";

export type ValidationCallback<T extends IdEntity> = (model: T, documentClient: DynamoDBDocument, userData: CognitoJwtPayload) => Promise<APIGatewayProxyResult | null>;

export class CrudHandlers<T extends IdEntity> {
    constructor(
        private readonly dao: BaseDao<T>,
        private readonly nameProperty: keyof T,
        private readonly entityName: string,
        private readonly documentClient: DynamoDBDocument
    ) {
    }

    public async deleteHandler(event: APIGatewayProxyEvent, _: Context): Promise<APIGatewayProxyResult> {
        try {
            const id = event.pathParameters?.id as string;

            const deletedModel = await this.dao.delete(id);
            if (deletedModel) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(deletedModel)
                };
            }
            return {
                statusCode: 422,
                body: JSON.stringify(new ErrorMessage(`Entity [${id}] not found`))
            }
        } catch (e) {
            return this.handleError(e);
        }

    }

    public async updateHandlerValidation(event: APIGatewayProxyEvent, context: Context, validationCallback: ValidationCallback<T>): Promise<APIGatewayProxyResult> {
        const model = this.getModelFromBody(event);
        const userData = getJwtPayloadFromEvent(event);
        const validation = await validationCallback(model, this.documentClient, userData);
        if (validation) {
            return validation;
        }
        const id = event.pathParameters?.id as string;
        return await this.update(model, id);
    }

    public async updateHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const id = event.pathParameters?.id as string;
        const model = this.getModelFromBody(event);
        return await this.update(model, id);
    }

    private async update(model: T, id: string) {
        try {
            model.id = id;

            const checkEntity = await this.dao.checkEntityByName(model);
            if (!checkEntity) {
                return this.errorNameExists(model);
            }


            const modelUpdated = await this.dao.update(model);

            if (!modelUpdated) {
                return {
                    statusCode: 422,
                    body: JSON.stringify(new ErrorMessage(`Could not update ${this.entityName} [${id}] with name ${model[this.nameProperty]}`))
                };
            }

            return {
                statusCode: 200,
                body: JSON.stringify(modelUpdated)
            };
        } catch (e) {
            return this.handleError(e);
        }

    }

    public async getHandler(event: APIGatewayProxyEvent, _: Context): Promise<APIGatewayProxyResult> {
        const id = event.pathParameters?.id as string;
        const model = await this.dao.getById(id);
        if (model) {
            return {
                statusCode: 200,
                body: JSON.stringify(model)
            };
        }
        return {
            statusCode: 404,
            body: JSON.stringify(new ErrorMessage(`${this.entityName} [${id}] not found`))
        }

    }

    public async listHandler(_: APIGatewayProxyEvent, _1: Context): Promise<APIGatewayProxyResult> {
        const result = await this.dao.list();

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    }

    public async createHandlerValidation(event: APIGatewayProxyEvent, context: Context, validationCallback: ValidationCallback<T>): Promise<APIGatewayProxyResult> {
        const model = this.getModelFromBody(event);
        const userData = getJwtPayloadFromEvent(event);
        const validation = await validationCallback(model, this.documentClient, userData);
        if (validation) {
            return validation;
        }

        return await this.create(model, event);
    }


    public async createHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const model = this.getModelFromBody(event);
        return await this.create(model, event);
    }

    private async create(model: T, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        const jwtPayload = getJwtPayloadFromEvent(event);
        model.username = jwtPayload["cognito:username"];
        try {
            const checkEntity = await this.dao.checkEntityByName(model);

            if (!checkEntity) {
                return this.errorNameExists(model);
            }
            await this.dao.insert(model);

            return {
                statusCode: 200,
                body: JSON.stringify(model)
            };
        } catch (e) {
            return this.handleError(e);
        }

    }

    private handleError(e: unknown) {
        console.error("Did not work: ", e);
        const accessDenied = e as AccessDeniedException;
        if (accessDenied.name == "AccessDeniedException") {
            return {
                statusCode: 401,
                body: JSON.stringify(new ErrorMessage('User lacking permission'))
            };
        }
        throw e;
    }

    errorNameExists(model: T) {
        return {
            statusCode: 409,
            body: JSON.stringify(new ErrorMessage(`${this.entityName} name [${model[this.nameProperty]}] already exists`))
        };
    }

    getModelFromBody(event: APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>): T {
        return JSON.parse(event.body as string) as T;
    }


}
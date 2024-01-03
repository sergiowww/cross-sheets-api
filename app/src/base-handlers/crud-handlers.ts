import {
    APIGatewayEventDefaultAuthorizerContext,
    APIGatewayProxyEventBase,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
    Context
} from "aws-lambda";
import {APIGatewayProxyEvent} from "aws-lambda/trigger/api-gateway-proxy";
import {BaseDao} from "../dao/base-dao";
import {IdEntity} from "../models/id-entity";
import {ErrorMessage} from "../models/error-message";
import {jwtDecode} from "jwt-decode";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";

export type ValidationCallback<T extends IdEntity> = (model: T) => Promise<APIGatewayProxyResult | null>;

export class CrudHandlers<T extends IdEntity> {
    constructor(
        private readonly dao: BaseDao<T>,
        private readonly nameProperty: keyof T,
        private readonly entityName: string
    ) {
    }

    public async deleteHandler(event: APIGatewayProxyEvent, _: Context): Promise<APIGatewayProxyResult> {
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
    }

    public async updateHandlerValidation(event: APIGatewayProxyEvent, context: Context, validationCallback: ValidationCallback<T>): Promise<APIGatewayProxyResult> {
        const model = this.getModelFromBody(event);
        const validation = await validationCallback(model);
        if (validation) {
            return validation;
        }
        const id = event.pathParameters?.id as string;
        return await this.update(model, id);
    }

    public async updateHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const [, bearerContent] = (event.headers['Authorization'] as string).split(' ');
        const jwtPayload = jwtDecode<CognitoJwtPayload>(bearerContent);
        const usersRole = jwtPayload["cognito:preferred_role"];
        console.log(jwtPayload, usersRole);
        const id = event.pathParameters?.id as string;
        const model = this.getModelFromBody(event);
        return await this.update(model, id);
    }

    private async update(model: T, id: string) {
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
        const validation = await validationCallback(model);
        if (validation) {
            return validation;
        }

        return await this.create(model);
    }


    public async createHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const model = this.getModelFromBody(event);
        return await this.create(model);
    }

    private async create(model: T) {
        const checkEntity = await this.dao.checkEntityByName(model);

        if (!checkEntity) {
            return this.errorNameExists(model);
        }
        await this.dao.insert(model);

        return {
            statusCode: 200,
            body: JSON.stringify(model)
        };
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

    getHandlers(): {
        createHandler: APIGatewayProxyHandler,
        listHandler: APIGatewayProxyHandler,
        getHandler: APIGatewayProxyHandler,
        updateHandler: APIGatewayProxyHandler,
        deleteHandler: APIGatewayProxyHandler
    } {
        return {
            createHandler: this.createHandler.bind(this),
            deleteHandler: this.deleteHandler.bind(this),
            getHandler: this.getHandler.bind(this),
            listHandler: this.listHandler.bind(this),
            updateHandler: this.updateHandler.bind(this)
        }
    }

}
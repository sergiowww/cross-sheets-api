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

export class CrudHandlers<T extends IdEntity> {
    constructor(
        private readonly dao: BaseDao<T>,
        private readonly nameProperty: keyof T,
        private readonly entityName: string
    ) {
    }

    public async deleteHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
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

    public async updateHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const id = event.pathParameters?.id as string;
        const model = this.getModelFromBody(event);
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

    public async getHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
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

    public async listHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const result = await this.dao.list();

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    }

    public async createHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
        const model = this.getModelFromBody(event);
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
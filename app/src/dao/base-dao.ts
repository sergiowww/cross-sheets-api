import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {IdEntity} from "../models/id-entity";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";
import {v4 as uuidv4} from "uuid";

export type ParamObject = { [key: string]: any };

export abstract class BaseDao<T extends IdEntity> {

    protected abstract readonly tableName: string

    constructor(public readonly documentClient: DynamoDBDocument,
                public readonly userData: CognitoJwtPayload) {
    }

    public async checkEntityByName(probe: T): Promise<boolean> {
        const {filterExpression, expressionAttributeValues} = this.getFilterByNameCriteria(probe);
        if (!filterExpression.length) {
            return true;
        }
        const scanResult = await this.documentClient.scan({
            TableName: this.tableName,
            Select: 'COUNT',
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues
        });

        const total = scanResult.Count;
        return !total;
    }

    public async insert(model: T) {
        model.id = this.generateId(model);
        await this.documentClient.put({
            TableName: this.tableName,
            Item: model
        });
    }

    public async list(): Promise<T[]> {
        const result = await this.documentClient.scan({
            TableName: this.tableName
        });
        return result.Items as T[];
    }

    public async delete(id: string): Promise<T | null> {
        const groupModel = await this.getById(id);
        if (!groupModel) {
            return null;
        }
        await this.documentClient.delete({
            TableName: this.tableName,
            Key: this.getKeyForUniqueSelection(id)
        })
        return groupModel;
    }

    protected getKeyForUniqueSelection(id: string) {
        return {id};
    }

    public async exists(id: string): Promise<boolean> {
        const result = await this.documentClient.get({
            TableName: this.tableName,
            Key: {id},
            ConsistentRead: false,
            ProjectionExpression: 'id'
        });
        const record = result.Item;
        return !!record;
    }

    public async getById(id: string): Promise<T> {
        const result = await this.documentClient.get({
            TableName: this.tableName,
            Key: this.getKeyForUniqueSelection(id),
            ConsistentRead: false
        });

        return result.Item as T;
    }

    public async update(model: T): Promise<T | null> {
        const {updateExpression, expressionAttributeValues} = this.updateCriteria(model);
        await this.documentClient.update({
            TableName: this.tableName,
            Key: this.getKeyForUpdate(model),
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        });
        return model;
    }

    protected getKeyForUpdate(model: T) {
        return {
            id: model.id
        };
    }

    protected abstract updateCriteria(model: T): { updateExpression: string, expressionAttributeValues: ParamObject };

    protected getFilterByNameCriteria(probe: T): { filterExpression: string, expressionAttributeValues: ParamObject } {
        return {
            filterExpression: "",
            expressionAttributeValues: {}
        };
    }

    protected generateId(model: T): string {
        return uuidv4();
    }
}
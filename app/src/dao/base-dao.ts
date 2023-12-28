import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {v4 as uuidv4} from "uuid";
import {IdEntity} from "../models/id-entity";

export type ParamObject = { [key: string]: string };

export abstract class BaseDao<T extends IdEntity> {

    protected abstract readonly tableName: string

    constructor(
        private readonly documentClient: DynamoDBDocument
    ) {
    }

    public async checkEntityByName(probe: T): Promise<boolean> {
        const {filterExpression, expressionAttributeValues} = this.getFilterByNameCriteria(probe);
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
        model.id = uuidv4();
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
            Key: {id}
        })
        return groupModel;
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
            Key: {id},
            ConsistentRead: false
        });

        return result.Item as T;
    }

    public async update(model: T): Promise<T | null> {
        try {
            const {updateExpression, expressionAttributeValues} = this.updateCriteria(model);
            await this.documentClient.update({
                TableName: this.tableName,
                Key: {
                    id: model.id
                },
                UpdateExpression: updateExpression,
                ExpressionAttributeValues: expressionAttributeValues
            });
            return model;
        } catch (e) {
            console.log('Error while saving: ', e);
            return null;
        }
    }

    protected abstract updateCriteria(model: T): { updateExpression: string, expressionAttributeValues: ParamObject };

    protected abstract getFilterByNameCriteria(probe: T): { filterExpression: string, expressionAttributeValues: ParamObject }
}
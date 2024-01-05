import {BaseDao, ParamObject} from "./base-dao";
import {ResultModel} from "../models/result-model";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";

export class ResultsDao extends BaseDao<ResultModel> {

    private readonly updateExpression: Array<keyof ResultModel> = [
        'id_benchmark',
        'result_time',
        'result_reps',
        'result_round',
        'result_weight',
        'category',
        'date_of_execution',
        'place',
        'notes'
    ];
    protected readonly tableName: string = process.env.RESULTS_TABLE_NAME as string;


    async list(): Promise<ResultModel[]> {
        const user = this.userData as CognitoJwtPayload;
        const result = await this.documentClient.query({
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': user["cognito:username"]
            },
            TableName: this.tableName,
            IndexName: process.env.USER_INDEX_NAME as string
        });
        return result.Items as ResultModel[];
    }

    protected updateCriteria(model: ResultModel): { updateExpression: string; expressionAttributeValues: ParamObject } {
        const nonNulls = this.updateExpression
            .filter(key => !!model[key]) as string[];
        const setFields = nonNulls
            .map(key => `${key} = :${key}`)
            .join(', ');

        const expressionAttributeValues = nonNulls.reduce((previousValue, currentValue) => {
            const key = `:${currentValue}`;
            // @ts-ignore
            previousValue[key] = model[currentValue];
            return previousValue;
        }, {} as ParamObject);

        console.log('expr', expressionAttributeValues);
        console.log('var', setFields);
        return {
            updateExpression: `set ${setFields}`,
            expressionAttributeValues
        };
    }

    protected getKeyForUpdate(model: ResultModel) {
        return {
            id: model.id,
            username: this.userData["cognito:username"]
        };
    }

    async getById(id: string): Promise<ResultModel> {
        const queryResult = await this.documentClient.query({
            KeyConditionExpression: 'id = :id and username = :username',
            ExpressionAttributeValues: {
                ':username': this.userData["cognito:username"],
                ':id': id
            },
            TableName: this.tableName
        });
        const allItems = queryResult.Items as ResultModel[];
        const [result] = allItems
        return result;
    }

}
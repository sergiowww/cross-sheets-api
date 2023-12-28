import {BaseDao} from "./base-dao";
import {TypeModel} from "../models/type-model";

export class TypesDao extends BaseDao<TypeModel> {
    protected readonly tableName: string = process.env.TYPES_TABLE_NAME as string;

    protected getFilterByNameCriteria(probe: TypeModel) {
        let filterExpression = 't_name = :type_name';
        const expressionAttributeValues: { [key: string]: string } = {
            ':type_name': probe.t_name
        };
        if (probe.id) {
            filterExpression += ' and id <> :type_id'
            expressionAttributeValues[':type_id'] = probe.id;
        }
        return {filterExpression, expressionAttributeValues};
    }

    protected updateCriteria(model: TypeModel) {
        return {
            updateExpression: 'set t_name = :type_name',
            expressionAttributeValues: {
                ':type_name': model.t_name
            }
        };
    }

}
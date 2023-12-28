import {GroupModel} from "../models/group-model";
import {BaseDao} from "./base-dao";
import * as process from "process";

export class GroupsDao extends BaseDao<GroupModel> {

    protected readonly tableName: string = process.env.GROUPS_TABLE_NAME as string;

    protected getFilterByNameCriteria(probe: GroupModel) {
        let filterExpression = 'g_name = :group_name';
        const expressionAttributeValues: { [key: string]: string } = {
            ':group_name': probe.g_name
        };
        if (probe.id) {
            filterExpression += ' and id <> :group_id'
            expressionAttributeValues[':group_id'] = probe.id;
        }
        return {filterExpression, expressionAttributeValues};
    }

    protected updateCriteria(model: GroupModel) {
        return {
            updateExpression: 'set g_name = :group_name',
            expressionAttributeValues: {
                ':group_name': model.g_name
            }
        };
    }

}
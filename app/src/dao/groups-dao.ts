import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {GroupModel} from "../models/group-model";
import {v4 as uuidv4} from "uuid";

export class GroupsDao {
    private readonly GROUPS_TABLE_NAME = process.env.GROUPS_TABLE_NAME;

    constructor(private documentClient: DynamoDBDocument) {
    }

    public async checkGroupName(groupModel: GroupModel): Promise<boolean> {
        let filterExpression = 'g_name = :group_name';
        const expressionAttributeValues: { [key: string]: string } = {
            ':group_name': groupModel.g_name
        };
        if (groupModel.id) {
            filterExpression += ' and id <> :group_id'
            expressionAttributeValues[':group_id'] = groupModel.id;
        }
        const scanResult = await this.documentClient.scan({
            TableName: this.GROUPS_TABLE_NAME,
            Select: 'COUNT',
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues
        });

        const total = scanResult.Count;
        return !total;
    }

    public async insert(group: GroupModel) {
        group.id = uuidv4();
        await this.documentClient.put({
            TableName: this.GROUPS_TABLE_NAME,
            Item: group
        });
    }

    public async list(): Promise<GroupModel[]> {
        const result = await this.documentClient.scan({
            TableName: this.GROUPS_TABLE_NAME
        });
        return result.Items as GroupModel[];
    }

    public async delete(id: string) {
        const groupModel = await this.getById(id);
        if (!groupModel) {
            return null;
        }
        await this.documentClient.delete({
            TableName: this.GROUPS_TABLE_NAME,
            Key: {id}
        })
        return groupModel;
    }

    public async getById(id: string) {
        const result = await this.documentClient.get({
            TableName: this.GROUPS_TABLE_NAME,
            Key: {id}
        });

        return result.Item as GroupModel;
    }

    public async update(group: GroupModel): Promise<GroupModel | null> {
        try {
            const result = await this.documentClient.update({
                TableName: this.GROUPS_TABLE_NAME,
                Key: {
                    id: group.id
                },
                UpdateExpression: 'set g_name = :group_name',
                ExpressionAttributeValues: {
                    ':group_name': group.g_name
                }
            });
            return group;
        } catch (e) {
            console.log('Error while saving: ', e);
            return null;
        }

    }
}
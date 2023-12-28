import {DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import {GroupModel} from "../models/group-model";

export class GroupsDao {
    private readonly GROUPS_TABLE_NAME = process.env.GROUPS_TABLE_NAME;

    constructor(private documentClient: DynamoDBDocument) {
    }

    public async checkGroupName(groupModel: GroupModel): Promise<boolean> {
        const scanResult = await this.documentClient.scan({
            TableName: this.GROUPS_TABLE_NAME,
            Select: 'COUNT',
            FilterExpression: 'g_name = :group_name',
            ExpressionAttributeValues: {
                ':group_name': groupModel.g_name
            }
        });

        const total = scanResult.Count;
        return !!total;
    }

    public async insert(group: GroupModel) {
        const result = await this.documentClient.put({
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
}
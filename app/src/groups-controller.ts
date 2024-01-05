import {defaultHandlersFactory} from "./base-handlers/default-handlers-factory";
import {GroupsDao} from "./dao/groups-dao";
import {GroupModel} from "./models/group-model";


const handlers = defaultHandlersFactory<GroupModel>(
    (documentClient, userData) => new GroupsDao(documentClient, userData),
    'g_name',
    'Group'
);

export const {
    createHandler,
    getHandler,
    deleteHandler,
    listHandler,
    updateHandler
} = handlers;
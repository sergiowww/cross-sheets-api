import {RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {AssetCode, Code, Function, Runtime} from 'aws-cdk-lib/aws-lambda';

import {JsonSchemaType, LambdaIntegration, Model, RequestValidator, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {HttpMethod} from "aws-cdk-lib/aws-apigatewayv2";
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";


export class CrossSheetsAppStack extends Stack {


    private _code: AssetCode;
    private get code(): AssetCode {
        if (!this._code) {
            this._code = Code.fromAsset('../app/dist');
        }
        return this._code;
    }

    private _restApi: RestApi;

    private get restApi(): RestApi {
        if (!this._restApi) {
            this._restApi = new RestApi(this, 'groups-api', {
                restApiName: 'groups-api',
            })
        }
        return this._restApi;
    }

    private readonly moduleController: string = 'groups-controller';

    private readonly groupsTableName: string = 'groups';

    private _groupTable: Table;
    private get groupTable(): Table {
        if (!this._groupTable) {
            this._groupTable = new Table(this, 'groups-table', {
                partitionKey: {
                    name: 'id',
                    type: AttributeType.STRING
                },
                billingMode: BillingMode.PROVISIONED,
                readCapacity: 1,
                writeCapacity: 1,
                tableName: this.groupsTableName,
                removalPolicy: RemovalPolicy.DESTROY
            });
        }
        return this._groupTable;
    }

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


        const createGroupsFn = this.createFn(this.moduleController, 'create');
        const getGroupsFn = this.createFn(this.moduleController, 'get');
        const listGroupsFn = this.createFn(this.moduleController, 'list');
        const updateGroupsFn = this.createFn(this.moduleController, 'update');
        const deleteGroupsFn = this.createFn(this.moduleController, 'delete');

        this.groupTable.grantReadWriteData(createGroupsFn);
        this.groupTable.grantReadData(getGroupsFn);
        this.groupTable.grantReadData(listGroupsFn);
        this.groupTable.grantWriteData(updateGroupsFn);
        this.groupTable.grantReadWriteData(deleteGroupsFn);

        const createGroupModel = this.createGroupModel();


        const groupsRoot = this.restApi.root.addResource('groups');
        groupsRoot.addMethod(HttpMethod.POST, new LambdaIntegration(createGroupsFn), {
            requestValidator: new RequestValidator(this, 'create-group-request-validator', {
                restApi: this.restApi,
                requestValidatorName: 'createGroupRequestValidator',
                validateRequestBody: true
            }),
            requestModels: {
                'application/json': createGroupModel
            }
        });
        groupsRoot.addMethod(HttpMethod.GET, new LambdaIntegration(listGroupsFn));
        const groupsById = groupsRoot.addResource('{id}');
        groupsById.addMethod(HttpMethod.GET, new LambdaIntegration(getGroupsFn));
        groupsById.addMethod(HttpMethod.PUT, new LambdaIntegration(updateGroupsFn), {
            requestValidator: new RequestValidator(this, 'update-group-request-validator', {
                restApi: this.restApi,
                requestValidatorName: 'updateGroupRequestValidator',
                validateRequestBody: true
            }),
            requestModels: {
                'application/json': createGroupModel
            }
        });
        groupsById.addMethod(HttpMethod.DELETE, new LambdaIntegration(deleteGroupsFn));


    }

    private createGroupModel() {
        return new Model(this, "create-group-model", {
            restApi: this.restApi,
            description: "Validate input for creating a group",
            modelName: "createGroupModel",
            contentType: "application/json",
            schema: {
                type: JsonSchemaType.OBJECT,
                required: ["g_name"],
                properties: {
                    name: {
                        type: JsonSchemaType.STRING,
                        maxLength: 50,
                        minLength: 2,
                    }
                }
            }
        });
    }

    private createFn(file: string, functionHandler: string): Function {
        return new Function(this, `${functionHandler}-${file}`, {
            code: this.code,
            handler: `${file}.${functionHandler}Handler`,
            runtime: Runtime.NODEJS_20_X,
            environment: {
                GROUPS_TABLE_NAME: this.groupsTableName
            }
        })
    }
}

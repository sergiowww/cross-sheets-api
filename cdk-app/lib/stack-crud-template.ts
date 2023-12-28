import {RemovalPolicy, Stack} from "aws-cdk-lib";
import {AssetCode, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaIntegration, Model, RequestValidator, RestApi} from "aws-cdk-lib/aws-apigateway";
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";
import {HttpMethod} from "aws-cdk-lib/aws-apigatewayv2";
import * as jsonSchema from "aws-cdk-lib/aws-apigateway/lib/json-schema";

export abstract class StackCrudTemplate {
    private _table: Table;
    private get table(): Table {
        if (!this._table) {
            this._table = new Table(this.stack, `${this.moduleName}-table`, {
                partitionKey: {
                    name: 'id',
                    type: AttributeType.STRING
                },
                billingMode: BillingMode.PROVISIONED,
                readCapacity: 1,
                writeCapacity: 1,
                tableName: this.tableName,
                removalPolicy: RemovalPolicy.DESTROY
            });
        }
        return this._table;
    }

    constructor(
        private readonly stack: Stack,
        private readonly moduleController: string,
        private readonly moduleName: string,
        private readonly tableName: string,
        private readonly code: AssetCode,
        private readonly restApi: RestApi
    ) {


        const createFn = this.createFn('create');
        const getFn = this.createFn('get');
        const listFn = this.createFn('list');
        const updateFn = this.createFn('update');
        const deleteFn = this.createFn('delete');

        this.table.grantReadWriteData(createFn);
        this.table.grantReadData(getFn);
        this.table.grantReadData(listFn);
        this.table.grantReadWriteData(updateFn);
        this.table.grantReadWriteData(deleteFn);

        const requestModel = this.createEntityModel();


        const groupsRoot = this.restApi.root.addResource(this.moduleName);
        groupsRoot.addMethod(HttpMethod.POST, new LambdaIntegration(createFn), {
            requestValidator: new RequestValidator(this.stack, `create-${this.moduleName}-request-validator`, {
                restApi: this.restApi,
                requestValidatorName: `${this.moduleName}RequestValidatorForCreating`,
                validateRequestBody: true
            }),
            requestModels: {
                'application/json': requestModel
            }
        });
        groupsRoot.addMethod(HttpMethod.GET, new LambdaIntegration(listFn));
        const groupsById = groupsRoot.addResource('{id}');
        groupsById.addMethod(HttpMethod.GET, new LambdaIntegration(getFn));
        groupsById.addMethod(HttpMethod.PUT, new LambdaIntegration(updateFn), {
            requestValidator: new RequestValidator(this.stack, `update-${this.moduleName}-request-validator`, {
                restApi: this.restApi,
                requestValidatorName: `${this.moduleName}RequestValidatorForUpdating`,
                validateRequestBody: true
            }),
            requestModels: {
                'application/json': requestModel
            }
        });
        groupsById.addMethod(HttpMethod.DELETE, new LambdaIntegration(deleteFn));


    }

    protected abstract getModelSchema(): jsonSchema.JsonSchema;

    private createEntityModel() {
        return new Model(this.stack, `${this.moduleName}-model`, {
            restApi: this.restApi,
            description: `Validate input for a ${this.moduleName}`,
            modelName: `${this.moduleName}Model`,
            contentType: "application/json",
            schema: this.getModelSchema()
        });
    }

    private createFn(functionHandler: string): Function {
        const file = this.moduleController;
        const tablePrefix = this.moduleName.toUpperCase();
        const tableEnvironment = `${tablePrefix}_TABLE_NAME`
        const environment: { [key: string]: string } = {};
        environment[tableEnvironment] = this.tableName
        return new Function(this.stack, `${functionHandler}-${file}`, {
            environment,
            code: this.code,
            handler: `${file}.${functionHandler}Handler`,
            runtime: Runtime.NODEJS_20_X
        })
    }
}
import {RemovalPolicy, Stack} from "aws-cdk-lib";
import {AssetCode, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {AuthorizationType, LambdaIntegration, Model, RequestValidator, RestApi} from "aws-cdk-lib/aws-apigateway";
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";
import {HttpMethod} from "aws-cdk-lib/aws-apigatewayv2";
import * as jsonSchema from "aws-cdk-lib/aws-apigateway/lib/json-schema";
import {CognitoConfig} from "./cognito-config";

export type EnvironmentProps = { [key: string]: string };

export abstract class StackCrudTemplate {
    private _table: Table;
    public get table(): Table {
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

    private _createFn: Function;
    get createFn(): Function {
        if (!this._createFn) {
            this._createFn = this.newFn('create');
        }
        return this._createFn;
    }

    private _getFn: Function;
    get getFn(): Function {
        if (!this._getFn) {
            this._getFn = this.newFn('get');
        }
        return this._getFn;
    }

    private _listFn: Function;
    get listFn(): Function {
        if (!this._listFn) {
            this._listFn = this.newFn('list');
        }
        return this._listFn;
    }

    private _updateFn: Function;
    get updateFn(): Function {
        if (!this._updateFn) {
            this._updateFn = this.newFn('update');
        }
        return this._updateFn;
    }

    private _deleteFn: Function;
    get deleteFn(): Function {
        if (!this._deleteFn) {
            this._deleteFn = this.newFn('delete');
        }
        return this._deleteFn;
    }

    get environment(): EnvironmentProps {
        const tablePrefix = this.moduleName.toUpperCase();
        const tableEnvironment = `${tablePrefix}_TABLE_NAME`
        const environment: { [key: string]: string } = {};
        environment[tableEnvironment] = this.tableName
        environment['IDENTITY_POOL_ID'] = this.cognitoConfig.identityPool.identityPoolId
        environment['ISSUER_NAME'] = this.cognitoConfig.issuerName;
        return {...environment, ...this.additionalEnv};
    }


    constructor(
        private readonly stack: Stack,
        private readonly moduleController: string,
        private readonly moduleName: string,
        private readonly tableName: string,
        private readonly code: AssetCode,
        private readonly restApi: RestApi,
        private readonly cognitoConfig: CognitoConfig,
        private additionalEnv: EnvironmentProps = {}
    ) {
        const authorizer = this.cognitoConfig.userPoolsAuthorizer;

        this.table.grantReadData(this.getFn);
        this.table.grantReadData(this.listFn);
        // this.table.grantReadWriteData(this.createFn);
        // this.table.grantReadWriteData(this.updateFn);
        // this.table.grantReadWriteData(this.deleteFn);


        const requestModel = this.createEntityModel();
        const groupsRoot = this.restApi.root.addResource(this.moduleName);
        groupsRoot.addMethod(HttpMethod.POST, this.createLambdaIntegration(this.createFn), {
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this.stack, `create-${this.moduleName}-request-validator`, {
                restApi: this.restApi,
                requestValidatorName: `${this.moduleName}RequestValidatorForCreating`,
                validateRequestBody: true
            }),
            requestModels: {
                'application/json': requestModel
            }
        });
        groupsRoot.addMethod(HttpMethod.GET, this.createLambdaIntegration(this.listFn), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        });
        const groupsById = groupsRoot.addResource('{id}');
        groupsById.addMethod(HttpMethod.GET, this.createLambdaIntegration(this.getFn), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        });
        groupsById.addMethod(HttpMethod.PUT, this.createLambdaIntegration(this.updateFn), {
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO,
            requestValidator: new RequestValidator(this.stack, `update-${this.moduleName}-request-validator`, {
                restApi: this.restApi,
                requestValidatorName: `${this.moduleName}RequestValidatorForUpdating`,
                validateRequestBody: true
            }),
            requestModels: {
                'application/json': requestModel
            }
        });
        groupsById.addMethod(HttpMethod.DELETE, this.createLambdaIntegration(this.deleteFn), {
            authorizer: authorizer,
            authorizationType: AuthorizationType.COGNITO,
        });


    }

    private createLambdaIntegration(fn: Function): LambdaIntegration {
        return new LambdaIntegration(fn, {proxy: true});
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

    private newFn(functionHandler: string): Function {
        const file = this.moduleController;
        const environment = this.environment;
        return new Function(this.stack, `${functionHandler}-${file}`, {
            environment,
            code: this.code,
            handler: `${file}.${functionHandler}Handler`,
            runtime: Runtime.NODEJS_20_X
        });
    }

}
import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {AssetCode, Code} from 'aws-cdk-lib/aws-lambda';
import {GroupsCrudTemplate} from "./groups-crud-template";
import {RestApi} from "aws-cdk-lib/aws-apigateway";
import {BenchmarksCrudTemplate} from "./benchmarks-crud-template";
import {ResultsCrudTemplate} from "./results-crud-template";
import {CognitoConfig} from "./cognito-config";


export class CrossSheetsAppStack extends Stack {

    private cognitoConfig: CognitoConfig;
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
            this._restApi = new RestApi(this, `cross-sheets-api`, {
                restApiName: `cross-sheets-api`
            });
        }
        return this._restApi;
    }

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.cognitoConfig = new CognitoConfig(this);

        const groupsCrudTemplate = new GroupsCrudTemplate(this,
            'groups-controller',
            'groups',
            'groups',
            this.code,
            this.restApi,
            this.cognitoConfig
        );
        groupsCrudTemplate.grantReadWriteForAdminAccess();
        groupsCrudTemplate.grantReadForUserAccess();
        groupsCrudTemplate.grantReadForFunction();
        const benchmarksCrudTemplate = new BenchmarksCrudTemplate(
            this,
            'benchmarks-controller',
            'benchmarks',
            'benchmarks',
            this.code,
            this.restApi,
            this.cognitoConfig,
            groupsCrudTemplate.environment
        );
        benchmarksCrudTemplate.grantReadWriteForAdminAccess();
        benchmarksCrudTemplate.grantReadForUserAccess();
        benchmarksCrudTemplate.grantReadForFunction();

        const resultsCrudTemplate = new ResultsCrudTemplate(
            this,
            'results-controller',
            'results',
            'results',
            this.code,
            this.restApi,
            this.cognitoConfig,
            benchmarksCrudTemplate.environment
        );
        resultsCrudTemplate.grantReadWriteForAdminAccess();
        resultsCrudTemplate.grantReadWriteForUserAccess();

    }


}

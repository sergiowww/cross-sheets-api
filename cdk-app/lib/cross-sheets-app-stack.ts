import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {AssetCode, Code} from 'aws-cdk-lib/aws-lambda';
import {GroupsCrudTemplate} from "./groups-crud-template";
import {RestApi} from "aws-cdk-lib/aws-apigateway";
import {BenchmarksCrudTemplate} from "./benchmarks-crud-template";


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
            this._restApi = new RestApi(this, `cross-sheets-api`, {
                restApiName: `cross-sheets-api`,
            })
        }
        return this._restApi;
    }


    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


        const groupsCrudTemplate = new GroupsCrudTemplate(this,
            'groups-controller',
            'groups',
            'groups',
            this.code,
            this.restApi
        );
        const benchmarksCrudTemplate = new BenchmarksCrudTemplate(
            this,
            'benchmarks-controller',
            'benchmarks',
            'benchmarks',
            this.code,
            this.restApi,
            groupsCrudTemplate.environment
        );
        groupsCrudTemplate.table.grantReadData(benchmarksCrudTemplate.createFn);
        groupsCrudTemplate.table.grantReadData(benchmarksCrudTemplate.updateFn);

    }


}

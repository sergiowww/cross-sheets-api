import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {AssetCode, Code} from 'aws-cdk-lib/aws-lambda';
import {GroupsCrudTemplate} from "./groups-crud-template";
import {TypesCrudTemplate} from "./types-crud-template";
import {RestApi} from "aws-cdk-lib/aws-apigateway";


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


        new GroupsCrudTemplate(this,
            'groups-controller',
            'groups',
            'groups',
            this.code,
            this.restApi
        );
        new TypesCrudTemplate(this,
            'types-controller',
            'types',
            'types',
            this.code,
            this.restApi
        );
    }


}

import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';

import {AssetCode, Code} from 'aws-cdk-lib/aws-lambda';
import {GroupsCrudTemplate} from "./groups-crud-template";


export class CrossSheetsAppStack extends Stack {


    private _code: AssetCode;
    private get code(): AssetCode {
        if (!this._code) {
            this._code = Code.fromAsset('../app/dist');
        }
        return this._code;
    }


    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);


        new GroupsCrudTemplate(this,
            'groups-controller',
            'groups',
            'groups',
            this.code
        )
    }


}

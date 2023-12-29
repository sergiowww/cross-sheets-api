import {
    AccountRecovery,
    AdvancedSecurityMode,
    Mfa,
    StringAttribute,
    UserPool,
    UserPoolEmail
} from "aws-cdk-lib/aws-cognito";
import {RemovalPolicy, Stack} from "aws-cdk-lib";
import {CognitoUserPoolsAuthorizer} from "aws-cdk-lib/aws-apigateway";

export class CognitoConfig {

    constructor(private readonly stack: Stack) {
    }

    private _userPoolsAuthorizer: CognitoUserPoolsAuthorizer;
    public get userPoolsAuthorizer() {
        if (!this._userPoolsAuthorizer) {
            this._userPoolsAuthorizer = new CognitoUserPoolsAuthorizer(this.stack, 'cross-sheets-up-authorizer', {
                cognitoUserPools: [this.userPool],
                authorizerName: 'cross-sheets-up-authorizer'
            });
        }
        return this._userPoolsAuthorizer;
    }


    private _userPool: UserPool;
    private get userPool(): UserPool {
        if (!this._userPool) {
            this._userPool = new UserPool(this.stack, 'cross-sheets-user-pool', {
                mfa: Mfa.OFF,
                autoVerify: {email: true},
                email: UserPoolEmail.withCognito('sergio@wicstech.net'),
                accountRecovery: AccountRecovery.EMAIL_ONLY,
                advancedSecurityMode: AdvancedSecurityMode.OFF,
                keepOriginal: {email: true},
                selfSignUpEnabled: true,
                signInCaseSensitive: false,
                standardAttributes: {
                    email: {
                        mutable: false,
                        required: true
                    },
                    birthdate: {
                        mutable: true,
                        required: false
                    },
                    gender: {
                        mutable: true,
                        required: false
                    },
                    website: {
                        mutable: true,
                        required: false
                    }
                },
                customAttributes: {
                    country: new StringAttribute({mutable: true}),
                    city: new StringAttribute({mutable: true})
                },
                userPoolName: 'cross-sheets-user-pool',
                removalPolicy: RemovalPolicy.DESTROY,
                deletionProtection: false

            });
            this._userPool.addDomain('cross-sheet-app-domain', {
               cognitoDomain: {
                   domainPrefix: 'cross-sheets-app-users'
               }
            });

        }
        return this._userPool
    }

}
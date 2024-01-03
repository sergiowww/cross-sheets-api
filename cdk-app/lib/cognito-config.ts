import {
    AccountRecovery,
    AdvancedSecurityMode,
    BooleanAttribute,
    CfnUserPoolGroup,
    ClientAttributes,
    Mfa,
    StringAttribute,
    UserPool,
    UserPoolClientIdentityProvider,
    UserPoolClientOptions,
    UserPoolEmail,
    VerificationEmailStyle
} from "aws-cdk-lib/aws-cognito";
import {CfnOutput, RemovalPolicy, Stack} from "aws-cdk-lib";
import {CognitoUserPoolsAuthorizer} from "aws-cdk-lib/aws-apigateway";
import {IdentityPool} from "@aws-cdk/aws-cognito-identitypool-alpha";
import {
    UserPoolAuthenticationProvider
} from "@aws-cdk/aws-cognito-identitypool-alpha/lib/identitypool-user-pool-authentication-provider";
import {FederatedPrincipal, Role} from "aws-cdk-lib/aws-iam";

export class CognitoConfig {
    constructor(private readonly stack: Stack) {
    }

    private get userPoolClientOptions(): UserPoolClientOptions {
        const readAttributes = new ClientAttributes()
            .withStandardAttributes({
                email: true,
                birthdate: true,
                website: true,
                gender: true
            })
            .withCustomAttributes(...['country', 'city', 'isAdmin']);

        return {
            readAttributes,
            writeAttributes: readAttributes,
            generateSecret: false,
            authFlows: {
                userPassword: true
            },
            oAuth: {
                flows: {
                    implicitCodeGrant: true,
                    authorizationCodeGrant: true
                },
                scopes: [
                    {scopeName: 'aws.cognito.signin.user.admin'},
                    {scopeName: 'email'},
                    {scopeName: 'openid'},
                    {scopeName: 'openid'},
                    {scopeName: 'phone'},
                    {scopeName: 'profile'}
                ]
            },
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO
            ]
        };
    };

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
                    city: new StringAttribute({mutable: true}),
                    isAdmin: new BooleanAttribute({mutable: false})
                },
                mfa: Mfa.OFF,
                autoVerify: {email: true},
                email: UserPoolEmail.withCognito('sergio@wicstech.net'),
                accountRecovery: AccountRecovery.EMAIL_ONLY,
                advancedSecurityMode: AdvancedSecurityMode.OFF,
                keepOriginal: {email: true},
                selfSignUpEnabled: true,
                signInCaseSensitive: false,
                userVerification: {
                    emailStyle: VerificationEmailStyle.CODE,
                    emailSubject: 'Verify your email for our Cross Sheets app!',
                    emailBody: 'Thanks for signing up to Cross Sheets App! Your verification code is {####}',
                    smsMessage: 'Thanks for signing up to Cross Sheets App! Your verification code is {####}',
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


            const identityPool = this.identityPool;


            new CfnUserPoolGroup(this.stack, 'admin-group', {
                userPoolId: this._userPool.userPoolId,
                groupName: 'admin-group',
                roleArn: this.adminRole.roleArn,
                description: 'Group for administrators of shared data',
                precedence: 0
            });

            // Export values
            new CfnOutput(this.stack, "UserPoolId", {
                value: this._userPool.userPoolId,
            });
            new CfnOutput(this.stack, "IdentityPoolId", {
                value: identityPool.identityPoolId,
            });


        }
        return this._userPool
    }

    private _adminRole: Role;
    public get adminRole() {
        if (!this._adminRole) {
            this._adminRole = new Role(this.stack, 'AppDataAdministratorRole', {
                description: 'It allows to change data that are visible for all users (eg. groups and benchmarks)',
                roleName: 'AppDataAdministratorRole',
                assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud": this.identityPool.identityPoolId,
                        },
                        "ForAnyValue:StringLike": {
                            "cognito-identity.amazonaws.com:amr": "authenticated",
                        },
                    },
                    "sts:AssumeRoleWithWebIdentity"
                )
            });
        }
        return this._adminRole;
    }


    private _identityPool: IdentityPool;
    private get identityPool() {
        if (!this._identityPool) {
            const userPoolClient = this._userPool.addClient('default-cross-sheets-client', this.userPoolClientOptions);
            this._identityPool = new IdentityPool(this.stack, 'cross-sheets-ip', {
                allowUnauthenticatedIdentities: false,
                identityPoolName: 'cross-sheets-identity-pool',
                authenticationProviders: {
                    userPools: [
                        new UserPoolAuthenticationProvider({
                            userPoolClient,
                            userPool: this._userPool
                        })
                    ]
                }
            });
        }
        return this._identityPool;
    }
}
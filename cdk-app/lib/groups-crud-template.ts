import {StackCrudTemplate} from "./stack-crud-template";
import {JsonSchemaType} from "aws-cdk-lib/aws-apigateway";
import * as jsonSchema from "aws-cdk-lib/aws-apigateway/lib/json-schema";

export class GroupsCrudTemplate extends StackCrudTemplate {

    protected getModelSchema(): jsonSchema.JsonSchema {
        return {
            type: JsonSchemaType.OBJECT,
            required: ["g_name"],
            properties: {
                g_name: {
                    type: JsonSchemaType.STRING,
                    maxLength: 50,
                    minLength: 2,
                }
            }
        }

    }
    protected get withUsernameAsSortKey(): boolean {
        return false;
    }

}
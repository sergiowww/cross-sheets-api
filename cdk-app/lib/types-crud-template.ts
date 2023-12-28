import {StackCrudTemplate} from "./stack-crud-template";
import {JsonSchema, JsonSchemaType} from "aws-cdk-lib/aws-apigateway";

export class TypesCrudTemplate extends StackCrudTemplate {
    protected getModelSchema(): JsonSchema {
        return {
            type: JsonSchemaType.OBJECT,
            required: ["t_name"],
            properties: {
                name: {
                    type: JsonSchemaType.STRING,
                    maxLength: 30,
                    minLength: 2,
                }
            }
        }
            ;
    }

}
import {StackCrudTemplate} from "./stack-crud-template";
import {JsonSchema, JsonSchemaType} from "aws-cdk-lib/aws-apigateway";

export class BenchmarksCrudTemplate extends StackCrudTemplate {
    protected getModelSchema(): JsonSchema {
        return {
            type: JsonSchemaType.OBJECT,
            required: ["b_name", "id_group", "id_type"],
            properties: {
                b_name: {
                    type: JsonSchemaType.STRING,
                    maxLength: 60,
                    minLength: 2,
                },
                id_group: {
                    type: JsonSchemaType.STRING,
                    format: 'uuid',
                    minLength: 2
                },
                id_type: {
                    type: JsonSchemaType.STRING,
                    format: 'uuid',
                    minLength: 2
                }
            }
        };

    }

}
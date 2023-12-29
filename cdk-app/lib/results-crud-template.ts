import {StackCrudTemplate} from "./stack-crud-template";
import {JsonSchema, JsonSchemaType} from "aws-cdk-lib/aws-apigateway";

export class ResultsCrudTemplate extends StackCrudTemplate {
    protected getModelSchema(): JsonSchema {
        return {
            type: JsonSchemaType.OBJECT,
            required: ["id_benchmark", "date_of_execution", "category", "id_type", "id_group"],
            properties: {
                id_benchmark: {
                    type: JsonSchemaType.STRING,
                    format: 'uuid',
                    minLength: 2
                },
                id_group: {
                    type: JsonSchemaType.STRING,
                    format: 'uuid'
                },
                id_type: {
                    type: JsonSchemaType.STRING,
                    format: 'uuid'
                },
                date_of_execution: {
                    type: JsonSchemaType.STRING,
                    format: 'date'
                },
                category: {
                    type: JsonSchemaType.STRING,
                    enum: ['RX', 'Scaled']
                },
                notes: {
                    type: JsonSchemaType.STRING,
                    maxLength: 500
                },
                place: {
                    type: JsonSchemaType.STRING,
                    maxLength: 50
                }
            }
        }

    }

}
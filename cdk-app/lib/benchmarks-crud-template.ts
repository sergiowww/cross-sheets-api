import {StackCrudTemplate} from "./stack-crud-template";
import {JsonSchema, JsonSchemaType} from "aws-cdk-lib/aws-apigateway";
import {WorkoutType} from '../../app/src/models/workout-type';

export class BenchmarksCrudTemplate extends StackCrudTemplate {
    protected getModelSchema(): JsonSchema {
        return {
            type: JsonSchemaType.OBJECT,
            required: ["b_name", "id_group", "wod_type"],
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
                wod_type: {
                    type: JsonSchemaType.STRING,
                    enum: Object.values(WorkoutType),
                    minLength: 2
                }
            }
        };

    }

}
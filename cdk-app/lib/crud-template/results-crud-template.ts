import {StackCrudTemplate} from "./stack-crud-template";
import {JsonSchema, JsonSchemaType} from "aws-cdk-lib/aws-apigateway";
import {Category} from "../../../app/src/models/category";

export class ResultsCrudTemplate extends StackCrudTemplate {
    protected getModelSchema(): JsonSchema {
        return {
            type: JsonSchemaType.OBJECT,
            required: ["id_benchmark", "date_of_execution", "category"],
            properties: {
                id_benchmark: {
                    type: JsonSchemaType.STRING,
                    format: 'uuid',
                    minLength: 2
                },
                date_of_execution: {
                    type: JsonSchemaType.STRING,
                    format: 'date',
                    pattern: "(((19|20)([2468][048]|[13579][26]|0[48])|2000)[/-]02[/-]29|((19|20)[0-9]{2}[/-](0[469]|11)[/-](0[1-9]|[12][0-9]|30)|(19|20)[0-9]{2}[/-](0[13578]|1[02])[/-](0[1-9]|[12][0-9]|3[01])|(19|20)[0-9]{2}[/-]02[/-](0[1-9]|1[0-9]|2[0-8])))"
                },
                category: {
                    type: JsonSchemaType.STRING,
                    enum: Object.values(Category)
                },
                notes: {
                    type: JsonSchemaType.STRING,
                    maxLength: 500
                },
                place: {
                    type: JsonSchemaType.STRING,
                    maxLength: 50
                },
                result_time: {
                    type: JsonSchemaType.STRING,
                    format: 'time',
                    pattern: '[0-9]+:[0-5][0-9]'
                },
                result_weight: {
                    type: JsonSchemaType.NUMBER,
                    minimum: 1
                },
                result_reps: {
                    type: JsonSchemaType.INTEGER,
                    minimum: 1
                },
                result_round: {
                    type: JsonSchemaType.INTEGER,
                    minimum: 1
                }
            }
        }

    }

}
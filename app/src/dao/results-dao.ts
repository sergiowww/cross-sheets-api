import {BaseDao, ParamObject} from "./base-dao";
import {ResultModel} from "../models/result-model";
import {CognitoJwtPayload} from "../models/cognito-jwt-payload";
import {v4 as uuidv4} from "uuid";

export class ResultsDao extends BaseDao<ResultModel> {
    protected readonly tableName: string = process.env.RESULTS_TABLE_NAME as string;

    protected updateCriteria(model: ResultModel): { updateExpression: string; expressionAttributeValues: ParamObject } {
        return {
            updateExpression: `set  id_benchmark = :id_benchmark, 
                                    result_time = :result_time, 
                                    result_reps = :result_reps, 
                                    result_round = :result_round, 
                                    result_weight = :result_weight, 
                                    category = :category, 
                                    date_of_execution = :date_of_execution, 
                                    place = :place, 
                                    notes = :notes 
            `,
            expressionAttributeValues: {
                ':id_benchmark': model.id_benchmark,
                ':result_time': model.result_time,
                ':result_reps': model.result_reps,
                ':result_round': model.result_round,
                ':result_weight': model.result_weight,
                ':category': model.category,
                ':date_of_execution': model.date_of_execution,
                ':place': model.place,
                ':notes': model.notes
            }
        };
    }

    protected generateId(model: ResultModel, jwtPayload: CognitoJwtPayload): string {
        return `${jwtPayload.email}_${uuidv4()}`;
    }

}
import {BaseDao, ParamObject} from "./base-dao";
import {BenchmarkModel} from "../models/benchmark-model";

export class BenchmarksDao extends BaseDao<BenchmarkModel> {
    protected readonly tableName: string = process.env.BENCHMARKS_TABLE_NAME as string;

    protected getFilterByNameCriteria(probe: BenchmarkModel): { filterExpression: string; expressionAttributeValues: ParamObject } {
        let filterExpression = 'b_name = :benchmark_name';
        const expressionAttributeValues: { [key: string]: string } = {
            ':benchmark_name': probe.b_name
        };
        if (probe.id) {
            filterExpression += ' and id <> :benchmark_id'
            expressionAttributeValues[':benchmark_id'] = probe.id;
        }
        return {filterExpression, expressionAttributeValues};
    }

    protected updateCriteria(model: BenchmarkModel): { updateExpression: string; expressionAttributeValues: ParamObject } {
        return {
            updateExpression: 'set b_name = :benchmark_name, id_type = :id_type, id_group = :id_group',
            expressionAttributeValues: {
                ':benchmark_name': model.b_name,
                ':id_group': model.id_group,
                ':id_type': model.id_type
            }
        };
    }

}
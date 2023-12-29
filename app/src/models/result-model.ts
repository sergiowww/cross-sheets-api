import {IdEntity} from "./id-entity";
import {Category} from "./category";

export interface ResultModel extends IdEntity {
    id_benchmark: string;
    date_of_execution: string;
    category: Category;
    notes: string;
    place: string;
    result_time: string;
    result_weight: number;
    result_reps: number;
    result_round: number;
}
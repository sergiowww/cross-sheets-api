import {IdEntity} from "./id-entity";
import {WorkoutType} from "./workout-type";

export interface BenchmarkModel extends IdEntity {
    wod_type: WorkoutType;
    id_group: string;
    b_name: string;
}
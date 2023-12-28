import {IdEntity} from "./id-entity";

export interface BenchmarkModel extends IdEntity {
    id_type: string;
    id_group: string;
    b_name: string;
}
import { Arena } from "../utils/index.js";

export type TypeArena = Arena<TypeModel>;

export class TypeModel {
  nodeId?: string;
  subName?: string;
}

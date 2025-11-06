import type { AdminTablePageConfig } from "./blocks/admin-table";
import type { DataChartBlockConfig } from "./blocks/data-chart";

export interface BlockConfigMap {
  "admin-table": AdminTablePageConfig;
  "data-chart": DataChartBlockConfig;
}

export type BlockType = keyof BlockConfigMap;

export type AnyBlockConfig = BlockConfigMap[BlockType];

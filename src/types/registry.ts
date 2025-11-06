import type { AdminTablePageConfig } from "./blocks/admin-table";
import type { DataChartBlockConfig } from "./blocks/data-chart";
import type { DataManagementBlockConfig } from "./blocks/data-management";

export interface BlockConfigMap {
  "admin-table": AdminTablePageConfig;
  "data-chart": DataChartBlockConfig;
  "data-management": DataManagementBlockConfig;
}

export type BlockType = keyof BlockConfigMap;

export type AnyBlockConfig = BlockConfigMap[BlockType];

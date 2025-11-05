import type { AdminTablePageConfig } from "./blocks/admin-table";

export interface BlockConfigMap {
  "admin-table": AdminTablePageConfig;
}

export type BlockType = keyof BlockConfigMap;

export type AnyBlockConfig = BlockConfigMap[BlockType];

import { blockRegistry } from "../../../lib/registry/block-registry";
import { DataManagementBlock } from "./data-management-block";

blockRegistry.register("data-management", DataManagementBlock);

export { DataManagementBlock };
export type { DataManagementBlockConfig } from "../../../types/blocks/data-management";

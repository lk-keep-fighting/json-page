import { blockRegistry } from "../../../lib/registry/block-registry";
import { AdminTableBlock } from "./admin-table-block";

blockRegistry.register("admin-table", AdminTableBlock);

export { AdminTableBlock };
export type { AdminTablePageConfig } from "../../../types/blocks/admin-table";

import { blockRegistry } from "../../../lib/registry/block-registry";
import { DataChartBlock } from "./data-chart-block";

blockRegistry.register("data-chart", DataChartBlock);

export { DataChartBlock };
export type { DataChartBlockConfig } from "../../../types/blocks/data-chart";

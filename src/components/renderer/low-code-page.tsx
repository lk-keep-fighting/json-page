import type { AnyBlockConfig, BlockConfigMap } from "../../types/registry";
import { blockRegistry } from "../../lib/registry/block-registry";

import "../blocks/admin-table";
import "../blocks/data-chart";
import "../blocks/data-management";

interface LowCodePageProps {
  config: AnyBlockConfig;
}

export function LowCodePage({ config }: LowCodePageProps) {
  const BlockComponent = blockRegistry.get(config.type);

  if (!BlockComponent) {
    return (
      <div className="m-6 rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        未找到类型为 <span className="font-medium text-foreground">{config.type}</span> 的区块渲染器。
      </div>
    );
  }

  return <BlockComponent config={config as BlockConfigMap[typeof config.type]} />;
}

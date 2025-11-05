import type { ComponentType } from "react";
import type { AnyBlockConfig, BlockConfigMap, BlockType } from "../../types/registry";

export type BlockRenderer<TConfig extends AnyBlockConfig = AnyBlockConfig> = ComponentType<{
  config: TConfig;
}>;

class BlockRegistry {
  private readonly registry = new Map<BlockType, BlockRenderer>();

  register<TType extends BlockType>(type: TType, renderer: BlockRenderer<BlockConfigMap[TType]>) {
    this.registry.set(type, renderer);
  }

  get<TType extends BlockType>(type: TType) {
    return this.registry.get(type) as BlockRenderer<BlockConfigMap[TType]> | undefined;
  }

  has(type: BlockType) {
    return this.registry.has(type);
  }

  clear() {
    this.registry.clear();
  }
}

export const blockRegistry = new BlockRegistry();

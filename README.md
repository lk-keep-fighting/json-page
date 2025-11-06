# React + shadcn Low-code Admin Framework

本项目实现了一个基于 **React** 与 **shadcn 风格组件库** 的低代码中后台页面引擎，可通过纯 JSON 配置渲染具备筛选、分页、表单与多种数据操作能力的管理页面。当前聚焦于「表格中心」的场景，并提供了模型化的配置层，方便未来对接页面设计器或远程配置服务。

## 核心能力

- **完全 JSON 驱动**：使用 `AdminTablePageConfig` 即可描述数据源、表格、筛选器、动作按钮等页面元素。
- **模型化配置层**：通过 `models` 字段定义表格视图、筛选表单、提交表单与数据操作模型，运行时由 `src/lib/models/admin-table.ts` 统一归一化。
- **灵活的数据源抽象**：内置静态数据与远程接口两种类型，支持分页、排序、筛选映射、响应字段映射等能力。
- **多样的交互与渲染**：
  - 全局、行级、批量操作均可配置 API 调用或外链行为，支持确认提醒与弹窗表单；
  - 筛选器涵盖文本、下拉、布尔与日期区间，支持 `defaultValue` 预设；
  - 表格列支持排序、对齐、货币/日期渲染、Badge 映射、自定义宽度等。
- **模板占位符系统**：接口地址、请求体、跳转链接均可通过 `{{ }}` 模板访问上下文（当前行、选中行、筛选条件、表单输入等）。

## 技术栈

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui 风格组件
- 状态与数据逻辑以 React Hooks + 纯函数实现，便于在设计器或微前端环境中复用

## 配置驱动架构

`AdminTablePageConfig` 是页面渲染的入口类型。框架同时兼容传统的扁平配置与全新的模型驱动写法：

### 基础配置（兼容模式）

```ts
const config: AdminTablePageConfig = {
  type: "admin-table",
  title: "用户管理",
  dataSource: { type: "static", data: [...] },
  filters: [...],
  headerActions: [...],
  table: {
    columns: [...],
    rowActions: [...],
    bulkActions: [...],
    pagination: { defaultPageSize: 10 }
  }
};
```

### 完全模型驱动

```ts
const config: AdminTablePageConfig = {
  type: "admin-table",
  title: "订单中心（模型驱动）",
  models: {
    view: {
      type: "table-view",
      dataSource: { type: "remote", endpoint: "/api/orders" },
      columns: [...],
      pagination: { defaultPageSize: 20 }
    },
    filterForms: [{ id: "order-filter", type: "filter-form", filters: [...] }],
    submissionForms: [{ id: "bulk-close", type: "submission-form", form: {...} }],
    operations: [
      { id: "refresh", type: "data-operation", scope: "global", behavior: {...} },
      { id: "assign", type: "data-operation", scope: "row", formRef: "assign-form", behavior: {...} }
    ]
  }
};
```

> 归一化规则会将模型层定义的数据与兼容模式下的字段合并，允许在渐进式改造中复用既有配置。

更多示例见 `src/config/example.ts` 中的 `exampleAdminConfig` 与 `exampleModelDrivenConfig`。

## 目录结构

```
.
├── src
│   ├── App.tsx                        // 示例页面入口
│   ├── main.tsx                       // Vite 挂载入口
│   ├── config/
│   │   └── example.ts                // 示例 JSON 配置集合
│   ├── components
│   │   ├── blocks
│   │   │   ├── admin-table/          // AdminTable 页面区块
│   │   │   ├── data-chart/           // 其他示例区块
│   │   │   ├── data-management/      // 其他示例区块
│   │   │   └── shared/data-table/    // 表格、筛选、动作等通用组件
│   │   ├── renderer/                 // JSON 渲染器入口（按区块类型分发）
│   │   └── ui/                       // 基于 shadcn 的基础 UI
│   ├── lib
│   │   ├── actions/                  // 动作执行与模板上下文
│   │   ├── data-sources/             // 数据源 Hook 与工具
│   │   ├── models/                   // 配置归一化逻辑
│   │   └── utils/                    // 公共工具函数
│   └── types/                        // TypeScript 类型声明
├── doc/
│   └── 低代码前端框架开发规范.md     // 深入的模型与规范说明
├── README.md
└── package.json
```

## 模板占位符

渲染引擎会在动作执行与请求构建时注入以下上下文：

| 占位符 | 含义 |
| ------ | ---- |
| `{{row}}` / `{{row.xxx}}` | 当前行数据（行级操作、表单提交时可用） |
| `{{rowId}}` | 当前行主键，自动从 `id`/`key`/`uuid` 推断 |
| `{{rows}}` | 批量操作时选中的行数组 |
| `{{rowIds}}` | 批量操作时选中的行主键数组 |
| `{{filters.xxx}}` | 当前筛选条件值 |
| `{{formValues.xxx}}` | 弹窗表单提交的字段值 |

这些模板可应用于 API `endpoint`、`bodyTemplate`、外链 `url` 等字段，实现动态注入。

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`，即可预览示例页面。修改 `src/config/example.ts` 或引入自定义 JSON 配置即可渲染新的管理页面。

## 深入文档

- [doc/低代码前端框架开发规范.md](doc/%E4%BD%8E%E4%BB%A3%E7%A0%81%E5%89%8D%E7%AB%AF%E6%A1%86%E6%9E%B6%E5%BC%80%E5%8F%91%E8%A7%84%E8%8C%83.md)：详细记录了数据模型、配置字段、模板上下文以及扩展约定。
- `src/types/blocks/admin-table.ts`：完整的 TypeScript 类型定义，可作为服务端或设计器的 Schema 依据。

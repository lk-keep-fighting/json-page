# React + shadcn Low-code Admin Framework

本项目实现了一个基于 **React** 与 **shadcn 风格组件库** 的低代码中后台页面引擎，能够通过 JSON 配置快速渲染常见的后台管理页（带筛选、表格、行/批量操作等能力）。

## 功能特点

- **JSON 驱动**：通过结构化配置描述数据源、筛选项、表格列、操作按钮等，即可渲染完整页面。
- **数据源抽象**：支持静态数组与远程接口两种类型，内置分页、排序、筛选映射能力。
- **丰富交互**：
  - 全局操作、行操作、批量操作，可配置 API 调用或外链行为；
  - 筛选条件支持文本、下拉、布尔、时间区间等常见类型；
  - 表格列支持 badge、布尔、日期、货币等多种渲染方式；
  - 内置分页、排序、勾选、空状态与加载/失败态展示。
- **模板占位**：接口地址、请求体字段可使用 `{{variable}}` 占位符动态注入上下文（当前行、选中行、筛选条件等）。

## 目录结构

```
.
├── src
│   ├── App.tsx                 // 示例应用入口
│   ├── main.tsx                // Vite 入口文件
│   ├── index.css               // Tailwind & 主题变量
│   ├── components
│   │   ├── lowcode             // 低代码核心能力
│   │   │   ├── AdminTable.tsx
│   │   │   ├── ActionBar.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── LowCodePage.tsx
│   │   │   ├── actionExecutor.ts
│   │   │   ├── dataSource.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── ui                  // 复刻 shadcn 风格组件
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── spinner.tsx
│   │       └── table.tsx
│   ├── config
│   │   └── example.ts          // 示例 JSON 配置
│   └── lib
│       └── cn.ts
├── index.html
├── package.json
└── tailwind.config.ts
```

## JSON 配置示例

`src/config/example.ts` 展示了一个用户管理页面的完整配置：

```ts
export const exampleAdminConfig: AdminTablePageConfig = {
  type: "admin-table",
  title: "用户管理",
  dataSource: {
    type: "static",
    data: [...] // 也可以配置远程接口
  },
  headerActions: [...],
  filters: [...],
  table: {
    selectable: true,
    columns: [...],
    rowActions: [...],
    bulkActions: [...]
  }
};
```

> 运行时会根据配置自动创建筛选条、数据表格、分页、操作按钮等。

### 模型驱动配置

`AdminTablePageConfig` 新增 `models` 字段，可在完全 JSON 驱动的场景下复用基础渲染能力：

- **表格视图模型 (`TableViewModel`)**：描述数据源、列配置、分页及空状态。
- **表单模型**：
  - `FilterFormModel`：定义筛选表单，支持 `defaultValue` 初始化筛选条件。
  - `SubmissionFormModel`：定义可复用的数据提交表单。
- **数据操作模型 (`DataOperationModel`)**：抽象全局 / 行 / 批量动作，支持内联表单或通过 `formRef` 关联提交表单模型。

此外，筛选项 (`FilterConfig`) 现在支持 `defaultValue` 字段，可在模型或传统配置中设定初始值。

```ts
const config: AdminTablePageConfig = {
  type: "admin-table",
  models: {
    view: { /* TableViewModel */ },
    filterForms: [{ /* FilterFormModel */ }],
    submissionForms: [{ id: "assign-order-form", form: { /* ActionFormConfig */ } }],
    operations: [
      {
        id: "assign-order",
        type: "data-operation",
        scope: "row",
        formRef: "assign-order-form",
        behavior: { type: "api", method: "POST", endpoint: "/api/orders/{{row.id}}/assign" }
      }
    ]
  }
};
```

> 可以参考 `src/config/example.ts` 中的 `exampleModelDrivenConfig`，了解表格视图、筛选表单、数据操作模型的组合方式。

## 动态模板占位

- `{{row.id}}`：当前行的字段
- `{{rowId}}`：当前行的主键（从 `id`/`key`/`uuid` 自动推断）
- `{{rows}}`：批量操作中选中的行数据数组
- `{{rowIds}}`：选中的行主键数组
- `{{filters.keyword}}`：当前的筛选条件

这些占位符可用于接口地址与请求体，例如：

```ts
{
  behavior: {
    type: "api",
    method: "POST",
    endpoint: "/api/users/{{rowId}}/disable",
    bodyTemplate: {
      reason: "批量禁用",
      filterKeyword: "{{filters.keyword}}"
    }
  }
}
```

## 开发说明

1. 安装依赖并启动开发服务器：

   ```bash
   npm install
   npm run dev
   ```

2. 打开浏览器访问 `http://localhost:5173` 查看示例页面。

3. 根据业务需求修改或新增 JSON 配置，即可快速生成新的后台页面。

> **提示**：在真实项目中可以将配置存储在数据库或远程服务，结合权限与数据接口，实现真正的低代码中后台搭建能力。

import type {
  AdminTablePageConfig,
  DataChartBlockConfig,
  DataManagementBlockConfig
} from "../components/renderer";

export const exampleAdminConfig: AdminTablePageConfig = {
  type: "admin-table",
  title: "用户管理",
  description: "通过 JSON 配置生成的低代码用户管理页面示例",
  dataSource: {
    type: "static",
    data: [
      {
        id: "u-1001",
        name: "张三",
        email: "zhangsan@example.com",
        status: "active",
        role: "管理员",
        balance: 12345.67,
        createdAt: "2024-09-10T09:15:00Z"
      },
      {
        id: "u-1002",
        name: "李四",
        email: "lisi@example.com",
        status: "inactive",
        role: "运营",
        balance: 246.8,
        createdAt: "2024-08-01T13:20:00Z"
      },
      {
        id: "u-1003",
        name: "王五",
        email: "wangwu@example.com",
        status: "active",
        role: "客服",
        balance: 9800,
        createdAt: "2024-08-15T19:30:00Z"
      },
      {
        id: "u-1004",
        name: "赵六",
        email: "zhaoliu@example.com",
        status: "pending",
        role: "审核",
        balance: 512,
        createdAt: "2024-09-21T08:45:00Z"
      }
    ]
  },
  headerActions: [
    {
      id: "create-user",
      label: "新建用户",
      scope: "global",
      intent: "default",
      behavior: {
        type: "link",
        url: "https://example.com/users/create",
        target: "_blank"
      }
    },
    {
      id: "refresh-data",
      label: "刷新数据",
      scope: "global",
      intent: "default",
      behavior: {
        type: "api",
        method: "POST",
        endpoint: "/api/users/refresh",
        successMessage: "刷新成功"
      }
    },
    {
      id: "send-notification",
      label: "发送通知",
      scope: "global",
      intent: "secondary",
      behavior: {
        type: "api",
        method: "POST",
        endpoint: "/api/notifications/send",
        bodyTemplate: {
          title: "{{formValues.title}}",
          message: "{{formValues.message}}",
          target: "{{formValues.target}}"
        },
        successMessage: "通知已发送"
      },
      form: {
        title: "发送系统通知",
        description: "通知将发送给所选角色的全部用户。",
        submitLabel: "立即发送",
        fields: [
          {
            id: "title",
            label: "通知标题",
            type: "text",
            placeholder: "请输入通知标题",
            required: true,
            maxLength: 50
          },
          {
            id: "message",
            label: "通知内容",
            type: "textarea",
            placeholder: "请输入通知内容",
            required: true,
            rows: 4,
            maxLength: 200
          },
          {
            id: "target",
            label: "通知对象",
            type: "select",
            placeholder: "请选择通知对象",
            required: true,
            defaultValue: "all",
            options: [
              { label: "全部用户", value: "all" },
              { label: "管理员", value: "admin" },
              { label: "运营", value: "operator" }
            ]
          }
        ]
      }
    }
  ],
  filters: [
    {
      id: "keyword",
      label: "关键字",
      field: "name",
      type: "text",
      placeholder: "输入姓名"
    },
    {
      id: "status",
      label: "状态",
      field: "status",
      type: "select",
      options: [
        { label: "启用", value: "active" },
        { label: "停用", value: "inactive" },
        { label: "待审核", value: "pending" }
      ]
    },
    {
      id: "createdAt",
      label: "创建时间",
      field: "createdAt",
      type: "date-range"
    }
  ],
  table: {
    selectable: true,
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20]
    },
    columns: [
      {
        id: "name",
        label: "姓名",
        dataIndex: "name",
        sortable: true
      },
      {
        id: "email",
        label: "邮箱",
        dataIndex: "email"
      },
      {
        id: "role",
        label: "角色",
        dataIndex: "role"
      },
      {
        id: "status",
        label: "状态",
        dataIndex: "status",
        renderType: "badge",
        valueMapping: [
          { value: "active", label: "启用", variant: "success" },
          { value: "inactive", label: "停用", variant: "destructive" },
          { value: "pending", label: "待审核", variant: "warning" }
        ]
      },
      {
        id: "balance",
        label: "账户余额",
        dataIndex: "balance",
        renderType: "currency",
        currency: {
          currency: "CNY"
        },
        align: "right"
      },
      {
        id: "createdAt",
        label: "创建时间",
        dataIndex: "createdAt",
        renderType: "date",
        sortable: true,
        dateFormat: {
          options: {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          }
        }
      }
    ],
    rowActions: [
      {
        id: "view-detail",
        label: "查看",
        scope: "row",
        intent: "ghost",
        behavior: {
          type: "link",
          url: "https://example.com/users/{{row.id}}",
          target: "_blank"
        }
      },
      {
        id: "disable-user",
        label: "停用",
        scope: "row",
        intent: "destructive",
        confirm: {
          title: "确定要停用该用户吗？"
        },
        behavior: {
          type: "api",
          method: "POST",
          endpoint: "/api/users/{{row.id}}/disable",
          successMessage: "停用成功"
        }
      },
      {
        id: "adjust-balance",
        label: "调整余额",
        scope: "row",
        intent: "outline",
        behavior: {
          type: "api",
          method: "POST",
          endpoint: "/api/users/{{row.id}}/adjust-balance",
          bodyTemplate: {
            amount: "{{formValues.amount}}",
            reason: "{{formValues.reason}}"
          },
          successMessage: "余额调整成功"
        },
        form: {
          title: "调整用户余额",
          description: "输入正数增加余额，负数表示扣减。",
          submitLabel: "提交调整",
          fields: [
            {
              id: "amount",
              label: "调整金额",
              type: "number",
              placeholder: "请输入金额",
              required: true,
              step: 0.01
            },
            {
              id: "reason",
              label: "调整原因",
              type: "textarea",
              placeholder: "请输入调整原因",
              required: true,
              rows: 3,
              maxLength: 200
            }
          ]
        }
      }
    ],
    bulkActions: [
      {
        id: "bulk-enable",
        label: "批量启用",
        scope: "bulk",
        intent: "secondary",
        requiresSelection: true,
        behavior: {
          type: "api",
          method: "POST",
          endpoint: "/api/users/bulk-enable",
          bodyTemplate: {
            userIds: "{{rowIds}}"
          },
          successMessage: "批量操作成功"
        }
      }
    ],
    emptyState: {
      title: "还没有相关用户",
      description: "请调整筛选条件或创建新的用户"
    }
  }
};

export const exampleChartConfig: DataChartBlockConfig = {
  type: "data-chart",
  title: "月度新增用户",
  description: "展示最近 6 个月的新增用户数量趋势",
  dataSource: {
    type: "static",
    data: [
      { month: "5月", signups: 96 },
      { month: "6月", signups: 142 },
      { month: "7月", signups: 168 },
      { month: "8月", signups: 154 },
      { month: "9月", signups: 187 },
      { month: "10月", signups: 205 }
    ]
  },
  chart: {
    type: "area",
    xField: "month",
    yField: "signups",
    maxItems: 12,
    color: "#2563eb",
    valueFormatter: {
      type: "number",
      maximumFractionDigits: 0
    }
  },
  emptyState: {
    title: "暂无趋势数据",
    description: "请检查数据源配置或稍后再试"
  }
};

export const examplePieChartConfig: DataChartBlockConfig = {
  type: "data-chart",
  title: "用户来源占比",
  description: "展示最近 30 天不同渠道的用户占比",
  dataSource: {
    type: "static",
    data: [
      { id: "channel-organic", channel: "自然搜索", users: 420 },
      { id: "channel-ads", channel: "广告投放", users: 310 },
      { id: "channel-social", channel: "社交媒体", users: 210 },
      { id: "channel-referral", channel: "推荐邀请", users: 160 }
    ]
  },
  chart: {
    type: "doughnut",
    xField: "channel",
    yField: "users",
    color: "#6366f1",
    colors: ["#6366f1", "#22d3ee", "#34d399", "#f97316"],
    height: 280,
    valueFormatter: {
      type: "number",
      maximumFractionDigits: 0
    }
  },
  emptyState: {
    title: "暂无渠道数据",
    description: "请检查数据源配置或稍后再试"
  }
};

export const exampleDataManagementConfig: DataManagementBlockConfig = {
  type: "data-management",
  title: "商品管理",
  description: "展示默认 CRUD 能力的数据管理组件示例",
  dataSource: {
    type: "static",
    data: [
      {
        id: "p-1001",
        name: "智能手表",
        category: "wearable",
        price: 1299,
        stock: 42,
        status: "on-sale",
        updatedAt: "2024-10-01T09:30:00Z"
      },
      {
        id: "p-1002",
        name: "降噪耳机",
        category: "audio",
        price: 899,
        stock: 12,
        status: "on-sale",
        updatedAt: "2024-09-26T14:15:00Z"
      },
      {
        id: "p-1003",
        name: "机械键盘",
        category: "peripheral",
        price: 699,
        stock: 0,
        status: "sold-out",
        updatedAt: "2024-09-18T08:45:00Z"
      },
      {
        id: "p-1004",
        name: "无线鼠标",
        category: "peripheral",
        price: 249,
        stock: 58,
        status: "draft",
        updatedAt: "2024-09-20T11:05:00Z"
      }
    ]
  },
  filters: [
    {
      id: "keyword",
      label: "关键字",
      field: "name",
      type: "text",
      placeholder: "输入商品名称"
    },
    {
      id: "status",
      label: "上架状态",
      field: "status",
      type: "select",
      options: [
        { label: "在售", value: "on-sale" },
        { label: "草稿", value: "draft" },
        { label: "售罄", value: "sold-out" }
      ]
    },
    {
      id: "category",
      label: "商品类别",
      field: "category",
      type: "select",
      options: [
        { label: "穿戴设备", value: "wearable" },
        { label: "音频设备", value: "audio" },
        { label: "电脑周边", value: "peripheral" }
      ]
    }
  ],
  crud: {
    baseEndpoint: "/api/products",
    create: {
      label: "新增商品",
      api: {
        successMessage: "新增商品成功"
      }
    },
    update: {
      label: "编辑",
      intent: "ghost",
      api: {
        successMessage: "更新商品成功"
      }
    },
    delete: {
      label: "删除",
      intent: "destructive",
      confirm: {
        title: "确定要删除该商品吗？",
        description: "删除后将无法恢复，请谨慎操作。"
      },
      api: {
        successMessage: "删除商品成功"
      }
    }
  },
  table: {
    selectable: true,
    pagination: {
      defaultPageSize: 5,
      pageSizeOptions: [5, 10, 20]
    },
    columns: [
      {
        id: "product-id",
        label: "商品编号",
        dataIndex: "id"
      },
      {
        id: "product-name",
        label: "商品名称",
        dataIndex: "name",
        sortable: true
      },
      {
        id: "product-category",
        label: "商品类别",
        dataIndex: "category",
        renderType: "badge",
        valueMapping: [
          { value: "wearable", label: "穿戴设备" },
          { value: "audio", label: "音频设备" },
          { value: "peripheral", label: "电脑周边" }
        ]
      },
      {
        id: "product-price",
        label: "售价",
        dataIndex: "price",
        renderType: "currency",
        currency: {
          currency: "CNY"
        },
        align: "right"
      },
      {
        id: "product-stock",
        label: "库存",
        dataIndex: "stock",
        align: "right"
      },
      {
        id: "product-status",
        label: "上架状态",
        dataIndex: "status",
        renderType: "badge",
        valueMapping: [
          { value: "on-sale", label: "在售", variant: "success" },
          { value: "draft", label: "草稿", variant: "secondary" },
          { value: "sold-out", label: "售罄", variant: "destructive" }
        ]
      },
      {
        id: "product-updated",
        label: "最近更新",
        dataIndex: "updatedAt",
        renderType: "date",
        sortable: true
      }
    ],
    emptyState: {
      title: "暂无商品数据",
      description: "请通过新增操作创建第一条记录"
    }
  }
};

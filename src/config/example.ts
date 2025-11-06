import type { AdminTablePageConfig, DataChartBlockConfig } from "../components/renderer";

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
    type: "line",
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

---
mobile: false
title: CascadingDateSelect 分段日期选择器
nav:
  title: assui
  path: /assui
group:
  title: 数据录入
  path: /components/input
---

# CascadingDateSelect 分段日期选择器

用三个等宽下拉框分别选择年、月、日。年份倒序至 1930，月份、日期正序，支持数字前缀搜索。搜索框仅接受数字，年份最多 4 位，月份和日期最多 2 位。选项不补零，完整日期输出为 ASCII 数字的 `YYYY-MM-DD`。

## 代码演示

### 基础使用

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/Basic.tsx"></code>

### 表单与 RTL

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/Form.tsx"></code>

## API

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| value | string | 完整受控日期；undefined 或空字符串表示未选择 |
| onChange | (value: string) => void | 仅选齐年月日后触发，父级负责更新 value |
| maxDate | string | 必填，有效的 YYYY-MM-DD 日期上限，包含当天，年份不得小于 1930 |
| placeholder | { year: string; month: string; day: string } | 必填，年、月、日的占位文案，同时用于无障碍标签 |
| notFoundContent | ReactNode | 搜索无匹配选项时的内容，默认使用 antd 文案 |
| id | string | Form.Item 注入，用于标签关联和错误滚动定位 |
| disabled | boolean | 禁用全部下拉框；未指定时继承 antd Form 的禁用状态 |
| className | string | 容器类名 |
| style | CSSProperties | 容器样式 |

组件不依赖业务项目的国际化模块。`placeholder` 和自定义 `notFoundContent` 由调用方传入当前语言的文案；antd 默认空状态文案和 RTL 由 antd ConfigProvider 控制。

按需导入时可使用 `assui/es/cascading-date-select`，并加载 `assui/es/cascading-date-select/style`；使用项目的 babel-plugin-import 配置时可从 `assui` 具名导入并自动加载样式。

## 日期联动

- 未选年时月份为 1～12；未选月时日期为 1～31；仅选 2 月时允许 29 日。
- 选定年月后按实际天数收敛日期；闰年切换到平年时 2 月 29 日变为 28 日。
- 最大年份仅显示截止月份；截止年月仅显示截止日期以内的日。
- 先选月日再选最大年份，超过截止日期时调整到最大可选日期，已满足范围时保持不变。
- 未选齐时只保存草稿，不补齐缺失字段、不触发 onChange。搜索只筛选当前可选项，不修改日期。
- 外部 value 或 maxDate 改变时重置草稿。外部完整值不自动改写、不主动触发 onChange。
- value 已为空且存在草稿时，重复传同一个空值无法表示重置意图；使用 Form.resetFields() 或改变组件 key 重置。
- 没有单项清空按钮，整个日期由外部清空或表单重置。

## 表单职责

标题、必填和外部日期合法性校验由外层 Form.Item 提供。内部 Select 继承 Form / Form.Item 的禁用和校验状态。

年龄等业务规则由调用方计算为 `maxDate` 后传入，组件不计算业务年龄上限。外部回填和程序赋值不会自动修正。

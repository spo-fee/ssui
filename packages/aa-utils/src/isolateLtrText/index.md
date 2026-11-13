---
mobile: false
title: isolateLtrText
nav:
  title: utils
  path: /utils
group:
  title: utils
  path: /utils
  order: 1
---

# isolateLtrText 文本方向隔离

为已组合完整的展示文本添加 Unicode LTR 隔离字符（U+2066、U+2069），保护负号、数字、百分号和币种顺序。函数不负责精度、千分位、单位推断或翻译。

## 代码演示

修改输入观察 RTL 环境中隔离前后的文本，表格同时列出负数、百分比、金额区间、零和空值。输入只保存原始文本，隔离结果仅用于展示。

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/Base.tsx"></code>

## 导入与用法

```ts
import { isolateLtrText } from 'aa-utils';
// 也可按路径导入：
// import isolateLtrText from 'aa-utils/es/isolateLtrText';

isolateLtrText('-12.50 USD'); // '\u2066-12.50 USD\u2069'
isolateLtrText(0); // '\u20660\u2069'
isolateLtrText(null); // ''
```

## API

`isolateLtrText(value: string | number | null | undefined): string`

| 输入 | 返回值 |
| --- | --- |
| 非空字符串、数字（含 0） | U+2066 + 原始文本 + U+2069 |
| null、undefined、空字符串 | 空字符串 |

将完整的“负号 + 数字 + 单位”组合后调用；不要只隔离数字并将币种留在外面，也不要重复隔离。翻译插值应接收字符串，不使用 number 类型的插值规则。

返回值包含不可见字符，不用于计算、表单业务值、接口参数或持久化。需要复制原始值时应使用原始输入。需要多个不同样式或交互元素时使用 `assui` 的 `IsolateLtrText`。

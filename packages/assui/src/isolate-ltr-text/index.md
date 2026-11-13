---
mobile: false
title: IsolateLtrText
nav:
  title: assui
  path: /assui
group:
  title: 其他
  path: /components/other
  order: 3
---

# IsolateLtrText 方向隔离容器

将数字、负号和单位组成的完整片段放在原生 `dir="ltr"` 容器内。适用于需要保留不同样式、事件或子元素的内容，不向文本添加控制字符。纯字符串或翻译插值优先使用 `aa-utils` 的 `isolateLtrText`。

## 代码演示

在 RTL 环境中对比数字与币种顺序，切换金额检查更新；鼠标悬停或点击“通过 ref 聚焦金额”可显示 Tooltip。示例同时演示默认 `span`、`div`、`a`、`button`、`input`、原生属性和焦点事件透传。

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/Base.tsx"></code>

## 导入

```ts
import { IsolateLtrText } from 'assui';
import type { IsolateLtrTextProps } from 'assui';
// 也可按路径导入：
// import IsolateLtrText from 'assui/es/isolate-ltr-text';
```

## API

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| children | 需要保持完整 LTR 顺序的内容；input 等空元素不传 children | React.ReactNode | — |
| as | React 支持的原生标签，包含 HTML 和 SVG 标签 | keyof React.JSX.IntrinsicElements | 'span' |
| ref | 透传到所选标签对应的 DOM 元素，如 a 对应 HTMLAnchorElement | React.ComponentPropsWithRef&lt;Tag&gt;['ref'] | — |
| 其他原生属性 | 随 as 推导，如 a 支持 href，button 支持 disabled | React.ComponentPropsWithoutRef&lt;Tag&gt; | — |

可用 `IsolateLtrTextProps<'a'>` 等泛型获取对应标签的属性类型；未指定泛型时默认为 span。非默认标签必须显式传入对应的 `as`，包括显式指定泛型或通过属性对象传参的情况。`as` 不接受自定义组件；调用方仍需遵守原生标签的嵌套、空元素和命名空间规则。SVG 标签可透传，具体文本方向表现需按实际 SVG 内容验证。

`dir` 固定为 `ltr`，不受调用方传值覆盖。数字及其单位应放在同一容器内；阿拉伯语标签留在容器外。支持直接作为 Tooltip 子元素，无需为了接收事件或 ref 再包一层 span。

方向隔离仅处理双向文本排列，不保证浏览器翻译修改 DOM 后的更新安全。浏览器翻译后的切换、焦点和提示行为需单独手动验证。

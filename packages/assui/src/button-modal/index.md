---
mobile: false
title: ButtonModal
nav:
  title: assui
  path: /assui
group:
  title: 反馈
  path: /components/feedback
  order: 1
---

# ButtonModal
点击一个按钮或者其他元素需要弹框展示或者做其他操作。

## 1. 代码演示

### 1.1. 基础使用

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/index.jsx" ></code>

### 1.2. state打开关闭

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/stateModalDemo.jsx" ></code>


### 1.3. FunctionChildren打开关闭

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/functionModalDemo.jsx" ></code>

### 1.4. ref打开关闭

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/refModalDemo.jsx" ></code>



### 1.5. 原生元素与 Fragment

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/NativeChildrenDemo.jsx" ></code>

## API

| 属性名 | 描述 | 类型 | 默认值 |
| ------ | ---- | ---- | ------ |
| trigger | 触发弹层显示的元素，或接收打开方法的渲染函数 | `React.ReactElement \| (open: () => void) => React.ReactElement` | - |
| children | 弹层内容，或接收 `modalAction` 的渲染函数 | `React.ReactElement \| (modalAction: ModalAction) => React.ReactElement` | - |
| onOpen | 打开时候的回调函数 | `() => void` | - |
| onClose | 关闭时候的回调函数 | `() => void` | - |

`ModalAction` 包含 `open()` 和 `close()` 方法。自定义内容组件会自动收到 `modalAction` 属性；原生 HTML/SVG 元素及 Fragment 原样渲染，不注入 action，也不会递归向内部组件注入。自定义组件向 DOM 透传 props 时，需要自行过滤 `modalAction`。

更多属性请参考 [antd modal](https://ant.design/components/modal-cn/#API)

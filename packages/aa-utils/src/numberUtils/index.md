---
mobile: false
title: numberUtils
nav:
  title: utils
  path: /utils
group:
  title: utils
  path: /utils
  order: 1
---

# 格式化数字

## 展示选项

在已有 `formatNumber`、`formatFixedFraction`、`formatPercent` 的 options 中增加四项展示能力。精度、舍入、千分位、百分比换算和空值判定保持原规则；默认会对带正负号或非空后缀的数值文本添加 LTR 隔离字符。三个方法仍返回字符串。

### 代码演示

修改“原始数值”查看前缀、后缀及三种格式化方法的组合结果；清空输入对比原有默认结果与空值占位；输入 0 对比默认判空与自定义判空。RTL 表格并列对比三个方法在默认、false、true 下的纯数字、带单位及占位结果，并用转义文本标出不可见隔离字符。

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/DisplayOptionsDemo.tsx"></code>

### 导入与用法

```ts
import { numberUtils } from 'aa-utils';
import type { OptionsConfig } from 'aa-utils/es/numberUtils';
// 也可按路径导入：
// import numberUtils from 'aa-utils/es/numberUtils';

numberUtils.formatNumber('12.5000'); // '12.50'，保留原有默认精度
numberUtils.formatNumber(null, { emptyValue: '-', prefix: '余额：', suffix: ' USD' }); // '-'，只展示占位内容
numberUtils.formatNumber(0, { emptyValue: '-' }); // '0.00'
numberUtils.formatNumber('12.5', { prefix: '+', suffix: ' USD' }); // '\u2066+12.50 USD\u2069'
numberUtils.formatFixedFraction('12.5', { fractionDigits: 3, suffix: ' USD' }); // '\u206612.500 USD\u2069'
numberUtils.formatPercent('0.125', { prefix: '+', suffix: ' /年' }); // '\u2066+12.50% /年\u2069'
numberUtils.formatNumber('-12.5', { suffix: ' USD', isolateLtr: false }); // '-12.50 USD'
numberUtils.formatNumber('12.5', { isolateLtr: true }); // '\u206612.50\u2069'
numberUtils.formatNumber(0, {
  emptyValue: (value) => {
    return value === 0 ? '-' : undefined;
  },
}); // '-'；非 0 值返回 undefined 后正常格式化
```

完整参数见下方 [formatNumber 的 options](#format-number-options)。

- 空值占位只展示 `emptyValue`，不拼接前后缀或百分号；`emptyValue` 回调返回 `undefined` 时正常格式化。
- 隔离后的字符串含不可见字符，仅用于展示；需要关闭时传 `isolateLtr: false`。

```js
const = {
  formatNumber, formatPercent, BigNumber, strip,
  plus, minus, times, divide, float2Fixed, digitLength
} =  numberUtils;
```
## 1. formatNumber
### 1.1. 基本使用(formatNumber)
<code hideActions='["CSB", "EXTERNAL"]' src="./demo/index.jsx" ></code>

### 1.2. usePlus(formatNumber)
<code hideActions='["CSB", "EXTERNAL"]' src="./demo/usePlus.jsx" ></code>

### 1.3. 截取浮点数,不会四舍五入(formatNumber)
<code hideActions='["CSB", "EXTERNAL"]' src="./demo/roundingMode.jsx" ></code>

### 1.4. 大数据
<code hideActions='["CSB", "EXTERNAL"]' src="./demo/bigData.jsx" ></code>

### 1.5. API（基于bignumber.js）

`formatNumber(value, options)`

#### 1.5.1. value
| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 需要处理的数字 | `number` \| `string` | - |

<a id="format-number-options"></a>

#### 1.5.2. options

`Value` 为现有数值输入类型 `BigNumber.Value | null | undefined`。`OptionsConfig` 的完整选项如下；`formatFixedFraction` 和 `formatPercent` 的共用选项也在此统一说明。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| useGrouping | 是否启用千分位分组 | `boolean` | false |
| usePlus | 正数添加正号 `+`，可与展示前缀 prefix 组合 | `boolean` | false |
| minFractionDigits | 保留小数位数的最小数目 | `number` | 2 |
| maxFractionDigits | 保留的小数位数的最大数目 | `number` | 2 |
| roundingMode | 舍入的方式 |`up \| down \| ceil \| floor \| halfUp \| halfDown \| halfEven \| halfCeil \| halfFloor` | halfUp |
| emptyValue | 字符串用于 null、undefined、空字符串的占位，0 不视为空值；函数接收原始值，返回字符串（含空串）时占位，返回 undefined 时正常格式化 | `string \| ((value: Value) => string \| undefined)` | 未配置，沿用原规则 |
| prefix | 展示前缀，空值占位时不展示 | `string` | 空字符串 |
| suffix | 展示后缀，位于数值及百分号之后，空格由调用方提供；空值占位时不展示 | `string` | 空字符串 |
| isolateLtr | 不传时自动隔离带正负号或非空后缀（含 %）的数值，纯无符号数字和占位不隔离；false 关闭；true 隔离全部非空结果 | `boolean` | 自动判断 |

> roundingMode说明： 默认值 `halfUp`是四舍五入，其他值：`down`总是向下舍去， `up`总是向上入，其他值可以看bignumber.js api

## 2. formatFixedFraction(固定小数位)


<code hideActions='["CSB", "EXTERNAL"]' src="./demo/formatFixedFraction.jsx" ></code>

### 2.1. API
`formatFixedFraction(value, options)`
#### 2.1.1. options
| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| number | 需要处理的数字 | `number \| stirng \| BigNumber.Instance` | - |

#### 2.1.2. options

共用选项见 [formatNumber 的 options](#format-number-options)。小数位使用 `fractionDigits` 控制，不提供 `minFractionDigits`、`maxFractionDigits`。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| fractionDigits | 保留小数位数的数目 | `number` | 8 |

## 3. 百分比(formatPercent)
<code hideActions='["CSB", "EXTERNAL"]' src="./demo/formatPercent.jsx" ></code>


### 3.1. API

`formatPercent(value, options)`

#### 3.1.1. value
| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 需要处理的数字 | `number` \| `string` | - |

#### 3.1.2. options

共用选项见 [formatNumber 的 options](#format-number-options)，另支持以下百分比选项。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| useUnit | 是否需要百分号 | `boolean` | true |


## 4. 数据精度问题
1. `0.1 + 0.2 = 0.30000000000000004`
2. `1.0 - 0.9 = 0.09999999999999998`
3. `toFixed` 的问题 `0.105.toFixed(2) = 0.10 // not 0.11`

### 4.1. 计算方法 times、plus、minus、divide（基于bigNumber）
<code hideActions='["CSB", "EXTERNAL"]' src="./demo/claculateFunc.jsx" ></code>

### 4.2. API
#### 4.2.1. 精确乘法
```js
times([Numbers])
```
#### 4.2.2. 精确加法
```js
plus([Numbers])
```
#### 4.2.3. 精确减法
```js
minus([Numbers])
```
#### 4.2.4. 精确除法
```js
divide([Numbers])
```

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `number \| stirng \| BigNumber.Instance` | 需要乘的数字 | - | - |

## 5. strip
把错误的数据转正

```jsx
/**
 * title: 代码块
 * hideActions: ["CSB", "EXTERNAL"]
 */
import React from 'react';
 import { Descriptions, Typography } from 'antd';
 import numberUtils from 'aa-utils/lib/numberUtils';

export default () => (
  <div>
     <Descriptions column={1}>
        <Descriptions.Item label="strip(0.09999999999999998)">
          {
            numberUtils.strip(0.09999999999999998)
          }
        </Descriptions.Item>
       </Descriptions>
  </div>
)
```
### 5.1. API

```js
strip(number, [precision=12])
```
| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| number | 需要处理的数字 | Number | - |
| precision | 需要精确的位数 | Number | 12 |

## 6. float2Fixed
把小数转成整数，支持科学计数法。如果是小数则放大成整数
```jsx
/**
 * title: 代码块
 * hideActions: ["CSB", "EXTERNAL"]
 */
import React from 'react';
 import { Descriptions, Typography } from 'antd';
 import numberUtils from 'aa-utils/lib/numberUtils';

export default () => (
  <div>
     <Descriptions column={1}>
        <Descriptions.Item label="strip(0.099999)">
          {
            numberUtils.float2Fixed(0.099999)
          }
        </Descriptions.Item>
       </Descriptions>
  </div>
)
```

### 6.1. API
```js
float2Fixed(Number)
```

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| number | 需要处理的数字 | Number | - |


## 7. 数字比较
1. `12345123451234512345 < 12345123451234512399`
2. `77777777.77777778 <= 77777777.77777777`
3. `12345123451234512399 > 12345123451234512345`
4. `77777777.77777777 >= 77777777.77777778`

<code hideActions='["CSB", "EXTERNAL"]' src="./demo/compare.jsx" ></code>

### 7.1. 小于
```js
isLessThan(numbers, base)
```
### 7.2. 小于等于
```js
isLessThanOrEqualTo(numbers, base)
```
### 7.3. 大于
```js
isGreaterThan(numbers, base)
```
### 7.4. 大于等于
```js
isGreaterThanOrEqualTo(numbers, base)
```

### 7.5. API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `number \| stirng \| BigNumber.Instance` | 数字 | - | - |
| `base \| stirng \| BigNumber.Instance` | 被比较的数字 | - | - |

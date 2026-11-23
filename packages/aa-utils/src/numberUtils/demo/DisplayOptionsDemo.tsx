import React, { useState } from 'react';
import { Input, Space } from 'antd';
import { numberUtils } from 'aa-utils';
import isNil from 'lodash/isNil';

const DisplayOptionsDemo = () => {
  const [value, setValue] = useState('1234.50');
  const options = { emptyValue: '-', prefix: '余额：', suffix: ' USD', isolateLtr: true };
  const examples = [
    ['默认格式（自动判断隔离）', numberUtils.formatNumber(value)],
    ['空值占位 emptyValue', numberUtils.formatNumber(value, { emptyValue: '-' })],
    [
      '自定义判空：空值或 0 显示无数据',
      numberUtils.formatNumber(value, {
        emptyValue: (input) => {
          return isNil(input) || input === '' || Number(input) === 0
            ? '无数据'
            : undefined;
        },
      }),
    ],
    ['前缀 prefix', numberUtils.formatNumber(value, { prefix: '余额：' })],
    ['后缀 suffix', numberUtils.formatNumber(value, { suffix: ' USD' })],
    ['四项组合：formatNumber', numberUtils.formatNumber(value, options)],
    [
      '四项组合：formatFixedFraction',
      numberUtils.formatFixedFraction(value, { ...options, fractionDigits: 3 }),
    ],
    [
      '四项组合：formatPercent',
      numberUtils.formatPercent(value, { ...options, suffix: ' /年' }),
    ],
    [
      '百分号关闭、保留后缀',
      numberUtils.formatPercent('0.125', { useUnit: false, suffix: ' /年' }),
    ],
    ['null 占位', numberUtils.formatNumber(null, { emptyValue: '-' })],
    ['空字符串占位', numberUtils.formatNumber('', { emptyValue: '-' })],
    ['零不使用占位', numberUtils.formatNumber(0, { emptyValue: '-' })],
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        aria-label="原始数值"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>选项</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          {examples.map(([label, result]) => {
            return (
              <tr key={label}>
                <td>{label}</td>
                <td>
                  <code>{result}</code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>输入负数观察符号隔离；正数不带单位时默认不隔离，百分号和非空后缀按单位处理。</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #d9d9d9', padding: 8 }}>方法 / 场景</th>
            <th style={{ border: '1px solid #d9d9d9', padding: 8 }}>展示内容</th>
            <th style={{ border: '1px solid #d9d9d9', padding: 8 }}>默认</th>
            <th style={{ border: '1px solid #d9d9d9', padding: 8 }}>false</th>
            <th style={{ border: '1px solid #d9d9d9', padding: 8 }}>true</th>
          </tr>
        </thead>
        <tbody>
          {[
            numberUtils.formatNumber,
            numberUtils.formatFixedFraction,
            numberUtils.formatPercent,
          ].map((format, index) => {
            const name = ['formatNumber', 'formatFixedFraction', 'formatPercent'][index];
            return [
              { label: '当前输入', input: value, prefix: '', suffix: '' },
              { label: '带单位', input: value, prefix: '', suffix: ' USD' },
              {
                label: '空值占位（配置前后缀）',
                input: null,
                prefix: '余额：',
                suffix: ' USD',
              },
            ].map(({ label, input, prefix, suffix }) => {
              const results = [undefined, false, true].map((isolateLtr) => {
                return {
                  key: String(isolateLtr),
                  value: format(input, { emptyValue: '-', prefix, suffix, isolateLtr }),
                };
              });
              return (
                <React.Fragment key={`${name}-${label}`}>
                  <tr>
                    <td
                      rowSpan={2}
                      style={{ border: '1px solid #d9d9d9', padding: 8 }}
                    >{`${name} / ${label}`}</td>
                    <th scope="row" style={{ border: '1px solid #d9d9d9', padding: 8 }}>
                      实际效果
                    </th>
                    {results.map((result) => {
                      return (
                        <td
                          key={result.key}
                          style={{ border: '1px solid #d9d9d9', padding: 8 }}
                        >
                          <div dir="rtl">{`الرصيد ${result.value}`}</div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th scope="row" style={{ border: '1px solid #d9d9d9', padding: 8 }}>
                      转义结果
                    </th>
                    {results.map((result) => {
                      return (
                        <td
                          key={result.key}
                          style={{ border: '1px solid #d9d9d9', padding: 8 }}
                        >
                          <code dir="ltr">
                            {result.value
                              .replace(/\u2066/g, '\\u2066')
                              .replace(/\u2069/g, '\\u2069')}
                          </code>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            });
          })}
        </tbody>
      </table>
      <p>
        “转义结果”行用 \u2066 和 \u2069
        标出不可见的隔离字符；实际效果不会显示这些转义文本，空占位不展示前后缀或百分号，也不会自动隔离。
      </p>
      <div dir="rtl">
        <p>{`未隔离： الرصيد ${numberUtils.formatNumber(value, { emptyValue: '-', suffix: ' USD', isolateLtr: false })}`}</p>
        <p>{`已隔离： الرصيد ${numberUtils.formatNumber(value, { emptyValue: '-', suffix: ' USD', isolateLtr: true })}`}</p>
      </div>
    </Space>
  );
};

export default DisplayOptionsDemo;

import React, { useState } from 'react';
import { Input, Space } from 'antd';
import { numberUtils } from 'aa-utils';
import isNil from 'lodash/isNil';

const DisplayOptionsDemo = () => {
  const [value, setValue] = useState('1234.50');
  const options = { emptyValue: '-', prefix: '[', suffix: ' USD]', isolateLtr: true };
  const examples = [
    ['原有默认格式', numberUtils.formatNumber(value)],
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
      numberUtils.formatPercent(value, { ...options, suffix: ' /年]' }),
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
      <div dir="rtl">
        <p>{`未隔离： الرصيد ${numberUtils.formatNumber(value, { emptyValue: '-', suffix: ' USD' })}`}</p>
        <p>{`已隔离： الرصيد ${numberUtils.formatNumber(value, { emptyValue: '-', suffix: ' USD', isolateLtr: true })}`}</p>
      </div>
    </Space>
  );
};

export default DisplayOptionsDemo;

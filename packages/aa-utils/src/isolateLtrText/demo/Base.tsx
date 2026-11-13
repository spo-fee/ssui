import React, { useState } from 'react';
import { Input, Space } from 'antd';
import { isolateLtrText } from 'aa-utils';

const Base = () => {
  const [value, setValue] = useState('-12.50 USD');
  const samples = [value, '-12.50%', '1,000-2,000 USD', 0, '', null, undefined];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        aria-label="完整展示文本"
        value={value}
        onChange={(event) => {
          return setValue(event.target.value);
        }}
        placeholder="输入完整数字和单位"
      />
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>输入</th>
            <th>RTL 未隔离</th>
            <th>RTL 已隔离</th>
            <th>返回字符串</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample, index) => {
            return (
              <tr key={index}>
                <td>
                  <code>{String(sample === '' ? '空字符串' : sample)}</code>
                </td>
                <td dir="rtl">{`القيمة ${sample ?? ''}`}</td>
                <td dir="rtl">{`القيمة ${isolateLtrText(sample)}`}</td>
                <td>
                  <code>{JSON.stringify(isolateLtrText(sample))}</code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Space>
  );
};

export default Base;

import React, { useRef, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { IsolateLtrText } from 'assui';

const Base = () => {
  const ref = useRef<HTMLElement>(null);
  const [amount, setAmount] = useState('-12.50');
  const [focused, setFocused] = useState(false);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Button
          onClick={() => {
            return setAmount(amount === '-12.50' ? '0.00' : '-12.50');
          }}
        >
          切换金额
        </Button>
        <Button
          onClick={() => {
            return ref.current?.focus();
          }}
        >
          通过 ref 聚焦金额
        </Button>
        <span>{focused ? '金额已聚焦' : '金额未聚焦'}</span>
      </Space>
      <Space>
        <IsolateLtrText
          as="a"
          href="#native-amount"
        >{`原生链接：${amount}`}</IsolateLtrText>
        <IsolateLtrText as="button" type="button" disabled>
          原生禁用按钮
        </IsolateLtrText>
        <IsolateLtrText as="input" aria-label="原生只读输入框" value={amount} readOnly />
      </Space>
      <div dir="rtl">
        <p>{`未隔离： الرصيد ${amount} USD`}</p>
        <p>
          <span>الرصيد </span>
          <Tooltip title="余额详情" trigger={['hover', 'focus']}>
            <IsolateLtrText
              ref={ref}
              tabIndex={0}
              aria-label="余额"
              className="amount"
              onFocus={() => {
                return setFocused(true);
              }}
              onBlur={() => {
                return setFocused(false);
              }}
            >
              <strong>{amount}</strong>
              <small> USD</small>
            </IsolateLtrText>
          </Tooltip>
        </p>
        <IsolateLtrText
          as="div"
          id="native-amount"
          style={{ border: '1px solid #ddd', padding: 12 }}
        >
          <div>{`块级容器：${amount} USD`}</div>
          <div>as="div" 保留块级内容结构</div>
        </IsolateLtrText>
      </div>
    </Space>
  );
};

export default Base;

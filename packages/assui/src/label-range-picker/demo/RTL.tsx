import React from 'react';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { LabelRangePicker } from 'assui';
import moment from 'moment';

const Demo = () => {
  const now = moment();

  return (
    <ConfigProvider direction="rtl" locale={arEG}>
      <div dir="rtl" style={{ width: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <LabelRangePicker
            allowClear
            defaultValue={[now.clone().subtract(7, 'days'), now]}
            label="نطاق التاريخ"
          />
        </div>
        <LabelRangePicker
          allowClear
          defaultValue={[now.clone().subtract(7, 'days'), now]}
          showTime
          label="النطاق الزمني"
        />
        <div style={{ marginTop: 16 }}>
          <LabelRangePicker
            allowClear
            defaultValue={[null, null]}
            label="نطاق التاريخ"
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Demo;

import React from 'react';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import {
  ConfigProvider as AssuiConfigProvider,
  LabelCustomizeRangePicker,
} from 'assui';
import moment from 'moment';

const Demo = () => {
  const now = moment();

  return (
    <ConfigProvider direction="rtl" locale={arEG}>
      <AssuiConfigProvider locale="ar">
        <div dir="rtl" style={{ width: 500 }}>
          <div style={{ marginBottom: 16 }}>
            <LabelCustomizeRangePicker
              allowClear
              defaultValue={[now.clone().subtract(7, 'days'), now]}
              label="نطاق التاريخ"
            />
          </div>
          <LabelCustomizeRangePicker
            allowClear
            defaultValue={[now.clone().subtract(7, 'days'), now]}
            showTime
            label="النطاق الزمني"
          />
        </div>
      </AssuiConfigProvider>
    </ConfigProvider>
  );
};

export default Demo;

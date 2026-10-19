import React from 'react';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { LabelDatePicker } from 'assui';
import moment from 'moment';

const Demo = () => {
  const now = moment();

  return (
    <ConfigProvider direction="rtl" locale={arEG}>
      <div dir="rtl" style={{ width: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <LabelDatePicker allowClear defaultValue={now} label="تاريخ البدء" />
        </div>
        <LabelDatePicker allowClear defaultValue={now} showTime label="وقت الانتهاء" />
      </div>
    </ConfigProvider>
  );
};

export default Demo;

import { useState } from 'react';
import { Form as AntForm, Button, Checkbox, ConfigProvider } from 'antd';
import { CascadingDateSelect } from 'assui';

const Form = () => {
  const [form] = AntForm.useForm<{ date: string }>();
  const [disabled, setDisabled] = useState(false);
  const [rtl, setRtl] = useState(false);

  return (
    <ConfigProvider direction={rtl ? 'rtl' : 'ltr'}>
      <Checkbox checked={rtl} onChange={(event) => setRtl(event.target.checked)}>
        RTL
      </Checkbox>
      <Checkbox
        checked={disabled}
        onChange={(event) => setDisabled(event.target.checked)}
      >
        禁用表单
      </Checkbox>
      <AntForm form={form} disabled={disabled} style={{ maxWidth: 480 }}>
        <AntForm.Item
          name="date"
          label="日期"
          rules={[{ required: true, message: '请选择完整日期' }]}
        >
          <CascadingDateSelect
            maxDate="2026-10-14"
            placeholder={{ year: '年', month: '月', day: '日' }}
          />
        </AntForm.Item>
        <Button htmlType="submit">提交</Button>
        <Button onClick={() => form.resetFields()}>重置</Button>
      </AntForm>
    </ConfigProvider>
  );
};

export default Form;

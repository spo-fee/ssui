import React from 'react';
import CalendarOutlined from 'a-icons/lib/CalendarOutlined';
import useControllableValue from 'ahooks/lib/useControllableValue';
import classNames from 'classnames';
import omit from 'lodash/omit';
import type { MomentRangePickerProps } from '../moment-date-picker';
import DatePicker from '../moment-date-picker';

const { RangePicker } = DatePicker;

export interface LabelRangePickerProps extends Omit<MomentRangePickerProps, 'label'> {
  label: React.ReactNode;
  showTime?: any;
}

const LabelDatePicker: React.FC<LabelRangePickerProps> = (props) => {
  const { className, label, showTime, ...restProps } = props;
  const datePickerRef = React.useRef<any>(null);
  const [open, onOpenChange] = useControllableValue(props, {
    valuePropName: 'open',
    defaultValuePropName: 'defaultOpen',
    trigger: 'onOpenChange',
  });

  const [value, setValue] = useControllableValue(props);

  const handleChange: NonNullable<MomentRangePickerProps['onChange']> = (
    nextValue,
    dateStrings,
  ) => {
    setValue(nextValue, dateStrings);
  };

  const handleLabelClick = () => {
    if (!open) {
      onOpenChange(!open);
    }
    datePickerRef.current?.focus();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <div
      className={classNames(
        {
          'label-range-picker': true,
          'label-range-picker-disabled': props.disabled,
          'label-range-picker-label-scale': open || value?.some(Boolean),
        },
        className,
      )}
    >
      <RangePicker
        format={showTime ? 'YYYY/MM/DD HH:mm:ss' : 'YYYY/MM/DD'}
        allowEmpty={[true, true]}
        showTime={showTime}
        {...omit(restProps, 'onOpenChange')}
        separator="–"
        open={open}
        onChange={handleChange}
        ref={datePickerRef}
        onOpenChange={handleOpenChange}
        suffixIcon={<CalendarOutlined />}
      />
      {/* biome-ignore lint/a11y/noLabelWithoutControl: 点击触发的展示文本，非表单 label */}
      <label className="label-range-picker-text" onClick={handleLabelClick}>
        {label}
      </label>
    </div>
  );
};

export default LabelDatePicker;

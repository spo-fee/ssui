import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { SelectProps } from 'antd/lib/select';
import Select from 'antd/lib/select';
import classNames from 'classnames';
import { DATE_PART, type DatePart } from './consts';
import useCascadingDateSelect from './useCascadingDateSelect';
import { filterDateOption } from './utils';

export interface CascadingDateSelectProps {
  /** 受控日期，格式 YYYY-MM-DD；undefined 或空字符串表示未选择。 */
  value?: string;
  /** 选齐年月日后触发，由调用方更新 value。 */
  onChange?: (value: string) => void;
  /** 可选日期上限（含当天），格式 YYYY-MM-DD，年份不得小于 1930。 */
  maxDate: string;
  /** 年、月、日的占位文案，由调用方提供当前语言的翻译。 */
  placeholder: Record<DatePart, string>;
  /** 搜索无匹配选项时的内容，未指定时使用 antd 的默认文案。 */
  notFoundContent?: SelectProps<number>['notFoundContent'];
  /** Form.Item 注入，用于标签关联和错误滚动定位。 */
  id?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const CascadingDateSelect = ({
  value,
  onChange,
  maxDate,
  placeholder,
  notFoundContent,
  id,
  disabled,
  className,
  style,
}: CascadingDateSelectProps) => {
  const [searchValues, setSearchValues] = useState<Record<DatePart, string>>({
    year: '',
    month: '',
    day: '',
  });
  const { parts, options, handleChange } = useCascadingDateSelect({
    value,
    maxDate,
    onChange,
  });

  return (
    <div className={classNames('cascading-date-select', className)} style={style}>
      {Object.values(DATE_PART).map((key) => {
        return (
          <Select<number>
            key={key}
            className="cascading-date-select-part"
            id={key === DATE_PART.year ? id : undefined}
            aria-label={placeholder[key]}
            placeholder={placeholder[key]}
            disabled={disabled}
            value={parts[key]}
            options={options[key]}
            showSearch
            searchValue={searchValues[key]}
            onSearch={(input) => {
              // 普通 Select 的搜索框不支持 maxLength，统一处理输入和粘贴的非数字及超长内容。
              const search = input
                .replace(/\D/g, '')
                .slice(0, key === DATE_PART.year ? 4 : 2);
              setSearchValues((previous) => ({ ...previous, [key]: search }));
            }}
            onDropdownVisibleChange={(open) => {
              if (!open) {
                setSearchValues((previous) => ({ ...previous, [key]: '' }));
              }
            }}
            filterOption={filterDateOption}
            notFoundContent={notFoundContent}
            onChange={(selected) => {
              handleChange(key, selected);
            }}
          />
        );
      })}
    </div>
  );
};

export default CascadingDateSelect;

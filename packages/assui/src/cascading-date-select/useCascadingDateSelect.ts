import { useState } from 'react';
import type { DatePart } from './consts';
import type { DateParts } from './utils';
import {
  formatDateParts,
  getDateOptions,
  getMaxDateParts,
  normalizeDateParts,
  parseDateParts,
} from './utils';

interface UseCascadingDateSelectProps {
  value?: string;
  maxDate: string;
  onChange?: (value: string) => void;
}

interface DateDraft {
  sourceValue?: string;
  sourceMaxDate: string;
  parts: DateParts;
}

const useCascadingDateSelect = ({
  value,
  maxDate,
  onChange,
}: UseCascadingDateSelectProps) => {
  const [draft, setDraft] = useState<DateDraft>({
    sourceValue: value,
    sourceMaxDate: maxDate,
    parts: {},
  });

  // 只保存未完成的草稿。外部回填、清空或改变范围时重置草稿，不复制完整受控值。
  const draftExpired = draft.sourceValue !== value || draft.sourceMaxDate !== maxDate;
  if (draftExpired) {
    setDraft({ sourceValue: value, sourceMaxDate: maxDate, parts: {} });
  }

  const parts = value ? parseDateParts(value) : draft.parts;
  const limit = getMaxDateParts(maxDate);
  const options = getDateOptions(parts, limit);

  const handleChange = (field: DatePart, selected: number) => {
    const nextParts = normalizeDateParts({ ...parts, [field]: selected }, limit);
    const nextValue = formatDateParts(nextParts);

    // 未选齐时只修改草稿，避免输出半成品日期。
    if (nextValue === undefined) {
      setDraft({ sourceValue: value, sourceMaxDate: maxDate, parts: nextParts });
      return;
    }

    // 父级不接受 onChange 时仍显示原受控值，不在内部提前提交完整日期。
    onChange?.(nextValue);
  };

  return { parts, options, handleChange };
};

export default useCascadingDateSelect;

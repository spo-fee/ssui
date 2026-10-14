import dateUtils from 'aa-utils/lib/dateUtils';
import type { SelectProps } from 'antd/lib/select';
import type { DatePart } from './consts';

export type DateParts = Partial<Record<DatePart, number>>;

export interface DateOption {
  label: string;
  value: number;
}

const MIN_YEAR = 1930;
const DATE_FORMAT = 'YYYY-MM-DD';

/** 将 YYYY-MM-DD 受控值拆为年月日；空值返回空对象，日期合法性由 Form 校验。 */
export const parseDateParts = (value?: string): DateParts => {
  if (!value) {
    return {};
  }

  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
};

/** 将父组件传入的有效截止日期转为完整年月日，供选项生成和联动共用。 */
export const getMaxDateParts = (maxDate: string): Required<DateParts> => {
  const date = dateUtils.parseDate(maxDate, DATE_FORMAT);
  return { year: date.year(), month: date.month() + 1, day: date.date() };
};

/** 选中截止年份时限制到截止月份；其他年份或未选年份时允许全部月份。 */
const getMaxMonth = (parts: DateParts, limit: Required<DateParts>) => {
  return parts.year === limit.year ? limit.month : 12;
};

/** 计算当前年月的最大可选日，兼顾月末、闰年和截止日；未选月份时允许到 31 日。 */
const getMaxDay = (parts: DateParts, limit: Required<DateParts>) => {
  if (parts.month === undefined) {
    return 31;
  }

  // 年份未选时按闰年生成日期，允许先选 2 月 29 日，再由年份收敛。
  const daysInMonth = dateUtils
    .parseDate(
      `${parts.year ?? 2000}-${String(parts.month).padStart(2, '0')}-01`,
      DATE_FORMAT,
    )
    .daysInMonth();
  const isLimitMonth = parts.year === limit.year && parts.month === limit.month;
  return isLimitMonth ? limit.day : daysInMonth;
};

/** 生成包含两端的正序数字选项，展示文本不补零；范围为空时返回空数组。 */
const createOptions = (start: number, end: number): DateOption[] => {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => {
    const value = start + index;
    return { label: String(value), value };
  });
};

/** 根据当前选择生成三个下拉列表：年份倒序至 1930，月份和日期按可选范围正序排列。 */
export const getDateOptions = (parts: DateParts, limit: Required<DateParts>) => {
  return {
    year: createOptions(MIN_YEAR, limit.year).reverse(),
    month: createOptions(1, getMaxMonth(parts, limit)),
    day: createOptions(1, getMaxDay(parts, limit)),
  };
};

/** 用户选择后将越界月日调整为最大可选值，保留未选字段，不修改传入对象。 */
export const normalizeDateParts = (
  parts: DateParts,
  limit: Required<DateParts>,
): DateParts => {
  const maxMonth = getMaxMonth(parts, limit);
  const monthExceeded = parts.month !== undefined && parts.month > maxMonth;

  // 月份越过截止日期时，已选月日一起收敛到截止月日；未选的日不自动补齐。
  if (monthExceeded) {
    return {
      ...parts,
      month: maxMonth,
      day: parts.day === undefined ? undefined : limit.day,
    };
  }

  return {
    ...parts,
    day:
      parts.day === undefined ? undefined : Math.min(parts.day, getMaxDay(parts, limit)),
  };
};

/** 年月日选齐后输出补零的 YYYY-MM-DD；未选齐时返回 undefined，避免提交半成品日期。 */
export const formatDateParts = ({ year, month, day }: DateParts) => {
  if (year === undefined || month === undefined || day === undefined) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** 按未补零的数字前缀筛选选项，例如输入 3 可匹配 3、30、31。 */
export const filterDateOption: Exclude<
  SelectProps['filterOption'],
  boolean | undefined
> = (input, option) => {
  return typeof option?.value === 'number' && String(option.value).startsWith(input);
};

export const DATE_PART = {
  /** 年份 */
  year: 'year',
  /** 月份 */
  month: 'month',
  /** 日期中的日 */
  day: 'day',
} as const;

export type DatePart = (typeof DATE_PART)[keyof typeof DATE_PART];

import {
  formatDateParts,
  getDateOptions,
  getMaxDateParts,
  normalizeDateParts,
} from '../utils';

describe('CascadingDateSelect 日期边界', () => {
  const limit = getMaxDateParts('2008-09-15');

  it('先选月日再选截止年份时收敛到截止日期', () => {
    expect(normalizeDateParts({ year: 2008, month: 12, day: 31 }, limit)).toEqual({
      year: 2008,
      month: 9,
      day: 15,
    });
    expect(normalizeDateParts({ year: 2008, month: 9, day: 30 }, limit)).toEqual({
      year: 2008,
      month: 9,
      day: 15,
    });
    expect(normalizeDateParts({ year: 2007, month: 12, day: 31 }, limit)).toEqual({
      year: 2007,
      month: 12,
      day: 31,
    });
  });

  it('选项包含 1930 年和截止日，不显示超出上限的选项', () => {
    const options = getDateOptions({ year: 2008, month: 9 }, limit);
    expect(options.year[0].value).toBe(2008);
    expect(options.year.at(-1)?.value).toBe(1930);
    expect(options.month.at(-1)?.value).toBe(9);
    expect(options.day.at(-1)?.value).toBe(15);
  });

  it('未选年份时允许 2 月 29 日，确定平年后收敛到 28 日', () => {
    expect(getDateOptions({ month: 2 }, limit).day.at(-1)?.value).toBe(29);
    expect(normalizeDateParts({ year: 2004, month: 2, day: 29 }, limit).day).toBe(29);
    expect(normalizeDateParts({ year: 2003, month: 2, day: 29 }, limit).day).toBe(28);
    expect(normalizeDateParts({ year: 2003, month: 4, day: 31 }, limit).day).toBe(30);
  });

  it('联动不补齐未选的字段，完整日期输出 ASCII 数字并补零', () => {
    const parts = normalizeDateParts({ year: 2008, month: 12 }, limit);
    expect(parts.day).toBeUndefined();
    expect(formatDateParts(parts)).toBeUndefined();
    expect(formatDateParts({ year: 2004, month: 2, day: 9 })).toBe('2004-02-09');
  });
});

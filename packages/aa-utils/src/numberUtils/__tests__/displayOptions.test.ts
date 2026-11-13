import numberUtils, { type OptionsConfig } from '../index';

const { formatNumber, formatFixedFraction, formatPercent } = numberUtils;

it('未配置新选项时保持既有精度及空值行为', () => {
  expect(formatNumber('12.5000')).toBe('12.50');
  expect(formatFixedFraction('12.5000')).toBe('12.50000000');
  expect(formatPercent('0.125')).toBe('12.50%');
  for (const value of [null, undefined, Number.NaN]) {
    expect(formatNumber(value)).toBe('0.00');
    expect(formatFixedFraction(value)).toBe('0.00000000');
    expect(formatPercent(value)).toBe('0.00%');
  }
  expect(formatNumber('')).toBe('NaN');
  expect(formatFixedFraction('')).toBe('NaN');
  expect(formatPercent('')).toBe('NaN%');
});

it.each([formatNumber, formatFixedFraction, formatPercent])(
  '三个格式化入口对空值占位，前后缀和隔离仅处理一次',
  (format) => {
    const options: OptionsConfig = {
      emptyValue: '-',
      prefix: '[',
      suffix: ']',
      isolateLtr: true,
    };
    for (const value of [null, undefined, '']) {
      expect(format(value, options)).toBe('\u2066[-]\u2069');
      expect(format(value, { emptyValue: '' })).toBe('');
    }
    expect(format(0, { emptyValue: '-' })).not.toBe('-');
    expect(format(Number.NaN, { emptyValue: '-' })).toBe(format(Number.NaN));
    expect(format('NaN', { emptyValue: '-' })).toBe(format('NaN'));
  },
);

it('前后缀与已有精度、千分位、舍入及正号选项组合', () => {
  expect(
    formatNumber('1234.567', {
      prefix: '余额：',
      suffix: ' USD',
      useGrouping: true,
      usePlus: true,
      roundingMode: 'down',
      isolateLtr: true,
    }),
  ).toBe('\u2066余额：+1,234.56 USD\u2069');
  expect(formatNumber('-12.5', { prefix: '[', suffix: ']', isolateLtr: false })).toBe(
    '[-12.50]',
  );
  expect(formatNumber('12.5', { prefix: '+' })).toBe('+12.50');
  expect(formatNumber('12.5', { suffix: ' USD' })).toBe('12.50 USD');
  expect(formatNumber('12.5', { isolateLtr: true })).toBe('\u206612.50\u2069');
  expect(formatNumber('9007199254740993.12', { suffix: ' USD' })).toBe(
    '9007199254740993.12 USD',
  );
  expect(
    formatFixedFraction('1234.5678', {
      fractionDigits: 3,
      roundingMode: 'down',
      useGrouping: true,
      prefix: '[',
      suffix: ' USD]',
      isolateLtr: true,
    }),
  ).toBe('\u2066[1,234.567 USD]\u2069');
});

it('百分号在后缀之前，最终完整文本统一隔离', () => {
  expect(formatPercent('0.125', { prefix: '+', suffix: ' /年', isolateLtr: true })).toBe(
    '\u2066+12.50% /年\u2069',
  );
  expect(
    formatPercent('0.125', {
      useUnit: false,
      prefix: '+',
      suffix: ' /年',
      isolateLtr: true,
    }),
  ).toBe('\u2066+12.50 /年\u2069');
  expect(
    formatPercent('12.34567', {
      usePlus: true,
      useGrouping: true,
      roundingMode: 'down',
      suffix: ' /年',
    }),
  ).toBe('+1,234.56% /年');
  expect(formatPercent(0, { emptyValue: '-', suffix: ' /年' })).toBe('0.00% /年');
});

it('继续提供原有计算方法，不提供 numberValue 工厂', () => {
  expect(numberUtils).not.toHaveProperty('numberValue');
  expect(numberUtils.plus('0.1', '0.2')).toBe('0.3');
  expect(numberUtils.times('1.25', 2)).toBe('2.5');
  expect(new numberUtils.BigNumber(1)).not.toHaveProperty('format');
});

it.each([formatNumber, formatFixedFraction, formatPercent])(
  '回调自定义判空，返回字符串或空字符串均使用占位',
  (format) => {
    expect(
      format(0, {
        emptyValue: (value) => {
          return value === 0 ? '-' : undefined;
        },
        prefix: '[',
        suffix: ']',
        isolateLtr: true,
      }),
    ).toBe('\u2066[-]\u2069');
    expect(
      format('N/A', {
        emptyValue: (value) => {
          return value === 'N/A' ? '' : undefined;
        },
      }),
    ).toBe('');
    expect(
      format(Number.NaN, {
        emptyValue: (value) => {
          return Number.isNaN(value) ? '无数据' : undefined;
        },
      }),
    ).toBe('无数据');
  },
);

it.each([formatNumber, formatFixedFraction, formatPercent])(
  '回调只接收一次原始值，返回 undefined 沿用正常格式化',
  (format) => {
    for (const value of [
      null,
      undefined,
      '',
      0,
      '0.125',
      Number.NaN,
      new numberUtils.BigNumber('0.125'),
    ]) {
      const emptyValue = jest.fn((_value: Parameters<typeof formatNumber>[0]) => {
        return undefined;
      });
      expect(
        format(value, { emptyValue, prefix: '[', suffix: ']', isolateLtr: true }),
      ).toBe(`\u2066[${format(value)}]\u2069`);
      expect(emptyValue).toHaveBeenCalledTimes(1);
      expect(emptyValue.mock.calls[0][0]).toBe(value);
    }
  },
);

it('百分比回调在乘以 100 前判断，命中后不附加百分号', () => {
  const emptyValue = jest.fn((value: Parameters<typeof formatNumber>[0]) => {
    return value === '0.125' ? '待定' : undefined;
  });
  expect(
    formatPercent('0.125', {
      emptyValue,
      prefix: '[',
      suffix: ' /年]',
      isolateLtr: true,
    }),
  ).toBe('\u2066[待定 /年]\u2069');
  expect(emptyValue).toHaveBeenCalledTimes(1);
  expect(emptyValue).toHaveBeenCalledWith('0.125');
});

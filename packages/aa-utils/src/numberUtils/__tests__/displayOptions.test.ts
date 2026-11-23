import numberUtils, { type OptionsConfig } from '../index';

const { formatNumber, formatFixedFraction, formatPercent } = numberUtils;

it('自动隔离不改变既有精度及空值格式化规则', () => {
  expect(formatNumber('12.5000')).toBe('12.50');
  expect(formatFixedFraction('12.5000')).toBe('12.50000000');
  expect(formatPercent('0.125')).toBe('\u206612.50%\u2069');
  for (const value of [null, undefined, Number.NaN]) {
    expect(formatNumber(value)).toBe('0.00');
    expect(formatFixedFraction(value)).toBe('0.00000000');
    expect(formatPercent(value)).toBe('\u20660.00%\u2069');
  }
  expect(formatNumber('')).toBe('NaN');
  expect(formatFixedFraction('')).toBe('NaN');
  expect(formatPercent('')).toBe('NaN%');
});

it.each([formatNumber, formatFixedFraction, formatPercent])(
  '三个格式化入口对空值占位，不附加前后缀',
  (format) => {
    const options: OptionsConfig = {
      emptyValue: '-',
      prefix: '[',
      suffix: ']',
      isolateLtr: true,
    };
    for (const value of [null, undefined, '']) {
      expect(format(value, options)).toBe('\u2066-\u2069');
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
  expect(formatNumber('12.5', { prefix: '+' })).toBe('\u2066+12.50\u2069');
  expect(formatNumber('12.5', { suffix: ' USD' })).toBe('\u206612.50 USD\u2069');
  expect(formatNumber('12.5', { isolateLtr: true })).toBe('\u206612.50\u2069');
  expect(formatNumber('9007199254740993.12', { suffix: ' USD' })).toBe(
    '\u20669007199254740993.12 USD\u2069',
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
  ).toBe('\u2066+1,234.56% /年\u2069');
  expect(formatPercent(0, { emptyValue: '-', suffix: ' /年' })).toBe(
    '\u20660.00% /年\u2069',
  );
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
    ).toBe('\u2066-\u2069');
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
      ).toBe(`\u2066[${format(value, { isolateLtr: false })}]\u2069`);
      expect(emptyValue).toHaveBeenCalledTimes(1);
      expect(emptyValue.mock.calls[0][0]).toBe(value);
    }
  },
);

it('百分比回调在乘以 100 前判断，命中后不附加百分号及后缀', () => {
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
  ).toBe('\u2066待定\u2069');
  expect(emptyValue).toHaveBeenCalledTimes(1);
  expect(emptyValue).toHaveBeenCalledWith('0.125');
});

it.each([formatNumber, formatFixedFraction, formatPercent])(
  'isolateLtr 三态覆盖符号、任意非空后缀及完整片段',
  (format) => {
    const cases: [Parameters<typeof formatNumber>[0], OptionsConfig][] = [
      [-12.5, {}],
      [12.5, { usePlus: true }],
      [12.5, { prefix: '+' }],
      [12.5, { prefix: '-' }],
      [12.5, { suffix: ' USD' }],
      [12.5, { suffix: ' 自定义单位' }],
      [12.5, { suffix: ' ' }],
      [-12.5, { suffix: ' USD', useGrouping: true }],
      [0, { suffix: ' USD' }],
    ];
    for (const [value, options] of cases) {
      const plain = format(value, { ...options, isolateLtr: false });
      expect(plain).not.toMatch(/[\u2066\u2069]/);
      expect(format(value, options)).toBe(`\u2066${plain}\u2069`);
      expect(format(value, { ...options, isolateLtr: undefined })).toBe(
        `\u2066${plain}\u2069`,
      );
      expect(format(value, { ...options, isolateLtr: true })).toBe(
        `\u2066${plain}\u2069`,
      );
    }
  },
);

it('纯数字默认不隔离，true 强制隔离；百分号也作为单位', () => {
  expect(formatNumber(12.5)).toBe('12.50');
  expect(formatNumber(12.5, { suffix: '' })).toBe('12.50');
  expect(formatNumber(12.5, { prefix: '余额：' })).toBe('余额：12.50');
  expect(formatNumber(12.5, { isolateLtr: true })).toBe('\u206612.50\u2069');
  expect(formatFixedFraction(12.5, { fractionDigits: 3 })).toBe('12.500');
  expect(formatFixedFraction(12.5, { fractionDigits: 3, isolateLtr: true })).toBe(
    '\u206612.500\u2069',
  );
  expect(formatPercent('0.125')).toBe('\u206612.50%\u2069');
  expect(formatPercent('0.125', { isolateLtr: false })).toBe('12.50%');
  expect(formatPercent('0.125', { useUnit: false })).toBe('12.50');
  expect(formatPercent('0.125', { useUnit: false, isolateLtr: true })).toBe(
    '\u206612.50\u2069',
  );
  expect(formatPercent('-0.125', { useUnit: false })).toBe('\u2066-12.50\u2069');
});

it.each([formatNumber, formatFixedFraction, formatPercent])(
  '占位不自动隔离，true 强制隔离非空输出，回调只调用一次',
  (format) => {
    for (const isolateLtr of [undefined, false, true]) {
      const emptyValue = jest.fn(() => {
        return '-12.50';
      });
      const options = { emptyValue, prefix: '+', suffix: ' USD', isolateLtr };
      expect(format(null, options)).toBe(isolateLtr ? '\u2066-12.50\u2069' : '-12.50');
      expect(emptyValue).toHaveBeenCalledTimes(1);
      expect(format(null, { emptyValue: '-', isolateLtr })).toBe(
        isolateLtr ? '\u2066-\u2069' : '-',
      );
      expect(format(null, { emptyValue: '', isolateLtr })).toBe('');
      const fallback = jest.fn(() => {
        return undefined;
      });
      expect(format('-12.5', { emptyValue: fallback, isolateLtr })).toBe(
        format('-12.5', { isolateLtr }),
      );
      expect(fallback).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledWith('-12.5');
    }
  },
);

it.each([formatNumber, formatFixedFraction, formatPercent])(
  '字符串与回调占位均不附加前后缀，回退正常格式化时保留前后缀',
  (format) => {
    for (const isolateLtr of [undefined, false, true]) {
      for (const value of [null, undefined, '']) {
        expect(
          format(value, {
            emptyValue: '-',
            prefix: '余额：',
            suffix: ' USD',
            isolateLtr,
          }),
        ).toBe(isolateLtr ? '\u2066-\u2069' : '-');
        expect(
          format(value, { emptyValue: '', prefix: '余额：', suffix: ' USD', isolateLtr }),
        ).toBe('');
      }
      expect(
        format(null, {
          emptyValue: '余额：暂无',
          prefix: '余额：',
          suffix: ' USD',
          isolateLtr,
        }),
      ).toBe(isolateLtr ? '\u2066余额：暂无\u2069' : '余额：暂无');
      const emptyValue = jest.fn((value) => {
        if (value === 0) {
          return '-';
        }
        return value === 'N/A' ? '' : undefined;
      });
      expect(
        format(0, { emptyValue, prefix: '余额：', suffix: ' USD', isolateLtr }),
      ).toBe(isolateLtr ? '\u2066-\u2069' : '-');
      expect(emptyValue).toHaveBeenCalledTimes(1);
      expect(emptyValue).toHaveBeenCalledWith(0);
      expect(
        format('N/A', { emptyValue, prefix: '余额：', suffix: ' USD', isolateLtr }),
      ).toBe('');
      expect(
        format(12.5, { emptyValue, prefix: '余额：', suffix: ' USD', isolateLtr }),
      ).toBe(format(12.5, { prefix: '余额：', suffix: ' USD', isolateLtr }));
    }
  },
);

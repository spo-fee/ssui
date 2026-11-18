import BigNumber from 'bignumber.js';
import lodashIsNaN from 'lodash/isNaN';
import isNil from 'lodash/isNil';
import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import isolateLtrText from '../isolateLtrText';
import { HALF_UP, roundingModeMap } from './const/roundingModeMap';
import { digitLength, float2Fixed, strip } from './numberPrecision';
import { divide, minus, plus, times } from './numberPrecision/calculateFunc';

type RoundingModeConfig =
  | 'up'
  | 'down'
  | 'ceil'
  | 'floor'
  | 'halfUp'
  | 'halfDown'
  | 'halfEven'
  | 'halfCeil'
  | 'halfFloor';
export interface OptionsConfig {
  useGrouping?: boolean;
  usePlus?: boolean;
  roundingMode?: RoundingModeConfig;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  /** 字符串用于默认空值占位；回调接收原始值，返回字符串时占位，undefined 时正常格式化。 */
  emptyValue?: string | ((value: Value) => string | undefined);
  /** 展示前缀，不参与计算。 */
  prefix?: string;
  /** 展示后缀，所需空格由调用方提供。 */
  suffix?: string;
  /** 对最终完整展示文本进行 LTR 隔离，默认关闭。 */
  isolateLtr?: boolean;
}

interface DefaultOptionsConfig extends OptionsConfig {
  roundingMode: RoundingModeConfig;
  minFractionDigits: number;
  maxFractionDigits: number;
}

type Value = BigNumber.Value | null | undefined;

const defaultOptions: DefaultOptionsConfig = {
  useGrouping: false,
  usePlus: false,
  roundingMode: HALF_UP,
  minFractionDigits: 2,
  maxFractionDigits: 2,
};

const checkValue = (value: any) => {
  if (isNull(value) || isUndefined(value) || lodashIsNaN(value)) {
    return '0';
  }

  return value;
};

const resolveEmptyValue = (value: Value, emptyValue: OptionsConfig['emptyValue']) => {
  if (typeof emptyValue === 'function') {
    return emptyValue(value);
  }

  return isNil(value) || value === '' ? emptyValue : undefined;
};

const formatDisplayValue = (
  value: string,
  { prefix = '', suffix = '', isolateLtr = false }: OptionsConfig = {},
) => {
  const displayValue = `${prefix}${value}${suffix}`;
  return isolateLtr ? isolateLtrText(displayValue) : displayValue;
};

const formatNumber = (value: Value, options?: OptionsConfig): string => {
  const emptyValue = resolveEmptyValue(value, options?.emptyValue);
  if (emptyValue !== undefined) {
    return formatDisplayValue(emptyValue, options);
  }

  const val = checkValue(value);
  const { useGrouping, minFractionDigits, maxFractionDigits, usePlus, roundingMode } = {
    ...defaultOptions,
    ...options,
  };

  const formatMethod = useGrouping ? 'toFormat' : 'toFixed';
  const numList = `${val}`.split('.');
  const decimalPart = numList[1] || '';
  const decimalPartLength = decimalPart.length;

  let resultFractionDigits: number = minFractionDigits;

  if (minFractionDigits !== maxFractionDigits) {
    if (decimalPartLength > maxFractionDigits) {
      resultFractionDigits = maxFractionDigits;
    } else if (decimalPartLength > minFractionDigits) {
      resultFractionDigits = decimalPartLength;
    } else {
      resultFractionDigits = minFractionDigits;
    }
  }

  const numberObj = new BigNumber(val);

  const formatValue = numberObj[formatMethod](
    resultFractionDigits,
    roundingModeMap[roundingMode],
  );

  if (+val > 0 && usePlus) {
    return formatDisplayValue(`+${formatValue}`, options);
  }

  return formatDisplayValue(formatValue, options);
};

export interface FormatFixedFractionOptions
  extends Omit<OptionsConfig, 'minFractionDigits' | 'maxFractionDigits'> {
  fractionDigits?: number;
}

const formatFixedFraction = (value: Value, options?: FormatFixedFractionOptions) => {
  const { fractionDigits = 8, ...restOptions } = options || {};
  const resultOptions = {
    minFractionDigits: fractionDigits,
    maxFractionDigits: fractionDigits,
    ...restOptions,
  };
  return formatNumber(value, resultOptions);
};

export interface formatPercentOptions extends OptionsConfig {
  useUnit?: boolean;
}

const defaultPercentOptions = {
  useUnit: true,
};

const formatPercent = (value: Value, options?: formatPercentOptions) => {
  const val = checkValue(value);

  const { useUnit, emptyValue, ...restFormatNumberOptions } = {
    ...defaultPercentOptions,
    ...options,
  };

  // 使用换算前的原始值判断，后续 formatNumber 不再接收判空选项，避免重复调用回调。
  const emptyDisplayValue = resolveEmptyValue(value, emptyValue);
  if (emptyDisplayValue !== undefined) {
    return formatDisplayValue(emptyDisplayValue, restFormatNumberOptions);
  }

  const resultValue = times(val, 100);
  return formatNumber(resultValue, {
    ...restFormatNumberOptions,
    suffix: `${useUnit ? '%' : ''}${restFormatNumberOptions.suffix ?? ''}`,
  });
};

const isGreaterThan = (value: BigNumber.Value, base: BigNumber.Value) => {
  const numberObj = new BigNumber(value);
  return numberObj.isGreaterThan(base);
};

const isGreaterThanOrEqualTo = (value: BigNumber.Value, base: BigNumber.Value) => {
  const numberObj = new BigNumber(value);
  return numberObj.isGreaterThanOrEqualTo(base);
};

const isLessThan = (value: BigNumber.Value, base: BigNumber.Value) => {
  const numberObj = new BigNumber(value);
  return numberObj.isLessThan(base);
};

const isLessThanOrEqualTo = (value: BigNumber.Value, base: BigNumber.Value) => {
  const numberObj = new BigNumber(value);
  return numberObj.isLessThanOrEqualTo(base);
};

export default {
  formatNumber,
  formatPercent,
  formatFixedFraction,
  BigNumber,
  strip,
  plus,
  minus,
  times,
  divide,
  float2Fixed,
  digitLength,
  isLessThan,
  isLessThanOrEqualTo,
  isGreaterThan,
  isGreaterThanOrEqualTo,
};

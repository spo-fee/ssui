import isNil from 'lodash/isNil';

/** 隔离已组合完整的展示文本；空值保持空串以保留调用处的占位逻辑。返回值不用于计算、表单或接口。 */
const isolateLtrText = (value: string | number | null | undefined): string => {
  return isNil(value) || value === '' ? '' : `\u2066${value}\u2069`;
};

export default isolateLtrText;

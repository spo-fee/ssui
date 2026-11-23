import numberUtils from '../index';

const {
  formatNumber,
  formatPercent,
  formatFixedFraction,
  isLessThan,
  isLessThanOrEqualTo,
  isGreaterThan,
  isGreaterThanOrEqualTo,
} = numberUtils;

describe('numberUtils', () => {
  it('formatNumber - default options should be defined', () => {
    expect(formatNumber(2)).toEqual('2.00');
    expect(formatNumber(2232323.101)).toEqual('2232323.10');
    expect(formatNumber(2.10444)).toEqual('2.10');
    expect(formatNumber(2.10544)).toEqual('2.11');
    expect(formatNumber(null)).toEqual('0.00');
    expect(formatNumber(undefined)).toEqual('0.00');
  });

  it('formatNumber - useGrouping and usePlus is true should be defined', () => {
    expect(formatNumber(2232323.101, { useGrouping: true, usePlus: true })).toEqual(
      '\u2066+2,232,323.10\u2069',
    );

    expect(formatNumber(-232323.101, { useGrouping: true, usePlus: true })).toEqual(
      '\u2066-232,323.10\u2069',
    );
  });

  it('formatNumber - if minFractionDigits !== maxFractionDigits should be defined', () => {
    expect(formatNumber(23.101, { minFractionDigits: 1, maxFractionDigits: 5 })).toEqual(
      '23.101',
    );
    expect(formatNumber(23.234, { minFractionDigits: 4, maxFractionDigits: 5 })).toEqual(
      '23.2340',
    );
    expect(
      formatNumber(23.234597, { minFractionDigits: 4, maxFractionDigits: 5 }),
    ).toEqual('23.23460');
    expect(formatNumber(23.2, { minFractionDigits: 2, maxFractionDigits: 5 })).toEqual(
      '23.20',
    );
  });

  it('formatNumber - number is to long should be defined', () => {
    expect(
      formatNumber('77777777.77777777', { minFractionDigits: 8, maxFractionDigits: 8 }),
    ).toEqual('77777777.77777777');
  });

  it('formatNumber - roundingMode should be defined', () => {
    expect(formatNumber(2.10544, { roundingMode: 'down' })).toEqual('2.10');
    expect(formatNumber(2.10244, { roundingMode: 'up' })).toEqual('2.11');
  });

  it('formatPercent default options should be defined', () => {
    expect(formatPercent(0.12343)).toEqual('\u206612.34%\u2069');
    expect(formatPercent(-0.1)).toEqual('\u2066-10.00%\u2069');

    expect(formatPercent(0.1, { usePlus: true })).toEqual('\u2066+10.00%\u2069');
    expect(formatPercent(-0.1, { usePlus: true })).toEqual('\u2066-10.00%\u2069');
  });

  it('formatPercent useUnit is false should be defined', () => {
    expect(formatPercent(0.12343, { useUnit: false })).toEqual('12.34');
  });

  it('formatFixedFraction should be defined ', () => {
    expect(formatFixedFraction(2332.2)).toEqual('2332.20000000');
    expect(formatFixedFraction(-2332.225, { fractionDigits: 4 })).toEqual(
      '\u2066-2332.2250\u2069',
    );
  });

  it('isGreaterThan, isGreaterThanOrEqualTo, isLessThan, isLessThanOrEqualTo  should be defined ', () => {
    expect(isLessThan('12345123451234512345', '12345123451234512399')).toBeTruthy();
    expect(isLessThanOrEqualTo('77777777.77777778', '77777777.77777777')).toBeFalsy();
    expect(isGreaterThan('12345123451234512399', '12345123451234512345')).toBeTruthy();
    expect(isGreaterThanOrEqualTo('77777777.77777777', '77777777.77777778')).toBeFalsy();
  });
});

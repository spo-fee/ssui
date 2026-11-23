import isolateLtrText from '../index';

describe('isolateLtrText', () => {
  it.each([
    ['-12.50 USD', '\u2066-12.50 USD\u2069'],
    ['1,000-2,000', '\u20661,000-2,000\u2069'],
    [0, '\u20660\u2069'],
    [null, ''],
    [undefined, ''],
    ['', ''],
  ])(
    'isolates complete display text and preserves empty values: %s',
    (value, expected) => {
      expect(isolateLtrText(value)).toBe(expected);
    },
  );
});

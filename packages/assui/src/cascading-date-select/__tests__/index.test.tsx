import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'antd';
import CascadingDateSelect from '../index';
import useCascadingDateSelect from '../useCascadingDateSelect';

describe('CascadingDateSelect 受控值与草稿', () => {
  it('只在选齐时通知父级，父级未接受时保留原受控值', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value?: string }) =>
        useCascadingDateSelect({ value, maxDate: '2008-09-15', onChange }),
      { initialProps: { value: undefined as string | undefined } },
    );

    act(() => result.current.handleChange('month', 12));
    act(() => result.current.handleChange('day', 31));
    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.parts).toEqual({ month: 12, day: 31 });

    act(() => result.current.handleChange('year', 2008));
    expect(onChange).toHaveBeenCalledWith('2008-09-15');
    expect(result.current.parts).toEqual({ month: 12, day: 31 });

    rerender({ value: '2008-09-15' });
    expect(result.current.parts).toEqual({ year: 2008, month: 9, day: 15 });
    act(() => result.current.handleChange('day', 10));
    expect(onChange).toHaveBeenLastCalledWith('2008-09-10');
    expect(result.current.parts.day).toBe(15);

    rerender({ value: undefined });
    expect(result.current.parts).toEqual({});
  });

  it('外部范围变化清空草稿，外部完整值不自动改写或通知父级', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value, maxDate }: { value?: string; maxDate: string }) =>
        useCascadingDateSelect({ value, maxDate, onChange }),
      {
        initialProps: {
          value: undefined as string | undefined,
          maxDate: '2008-09-15',
        },
      },
    );
    act(() => result.current.handleChange('month', 2));
    rerender({ value: undefined, maxDate: '2007-09-15' });
    expect(result.current.parts).toEqual({});

    rerender({ value: '2008-12-31', maxDate: '2007-09-15' });
    expect(result.current.parts).toEqual({ year: 2008, month: 12, day: 31 });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('CascadingDateSelect 表单与搜索', () => {
  const placeholder = { year: 'Year', month: 'Month', day: 'Day' };
  const originalMatchMedia = window.matchMedia;

  beforeAll(() => {
    // jsdom 不提供 matchMedia，antd Form 的响应式布局需要此浏览器 API。
    window.matchMedia = jest.fn((media: string) => ({
      matches: false,
      media,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => false),
    }));
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('继承 Form 的禁用和 Form.Item 的校验状态，并保留标签关联', () => {
    const { getAllByRole, container } = render(
      <Form disabled>
        <Form.Item name="date" label="Date" validateStatus="error">
          <CascadingDateSelect maxDate="2008-09-15" placeholder={placeholder} />
        </Form.Item>
      </Form>,
    );
    const inputs = getAllByRole('combobox');
    inputs.forEach((input) => {
      expect(input.hasAttribute('disabled')).toBe(true);
    });
    expect(inputs[0].id).toBe('date');
    expect(container.querySelectorAll('.ant-select-status-error')).toHaveLength(3);
    expect(container.querySelector('label')?.htmlFor).toBe('date');
  });

  it('按未补零数字前缀搜索，不修改受控日期', () => {
    const onChange = jest.fn();
    const { getByRole, queryByText, getByText } = render(
      <CascadingDateSelect
        maxDate="2008-09-15"
        placeholder={placeholder}
        onChange={onChange}
      />,
    );
    const dayInput = getByRole('combobox', { name: 'Day' });
    fireEvent.mouseDown(dayInput);
    fireEvent.change(dayInput, { target: { value: '3' } });
    expect(getByText('30', { selector: '.ant-select-item-option-content' })).toBeTruthy();
    expect(getByText('31', { selector: '.ant-select-item-option-content' })).toBeTruthy();
    expect(queryByText('13')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    ['Year', '1234', '2008'],
    ['Month', '12', '20'],
    ['Day', '12', '20'],
  ])('%s 搜索仅接受数字并限制位数，输入和粘贴均生效', async (name, typed, pasted) => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { getByRole } = render(
      <CascadingDateSelect
        maxDate="2008-09-15"
        placeholder={placeholder}
        onChange={onChange}
      />,
    );
    const input = getByRole('combobox', { name }) as HTMLInputElement;
    await user.click(input);
    await user.type(input, 'a1中2-3.456');
    expect(input.value).toBe(typed);

    await user.clear(input);
    expect(input.value).toBe('');
    await user.paste('年2008a99');
    expect(input.value).toBe(pasted);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('选择选项或离开下拉框后清空搜索，保留选择结果', async () => {
    const user = userEvent.setup();
    const { getByRole, getByText } = render(
      <CascadingDateSelect maxDate="2008-09-15" placeholder={placeholder} />,
    );
    const input = getByRole('combobox', { name: 'Day' }) as HTMLInputElement;
    await user.click(input);
    await user.type(input, '30');
    await user.click(getByText('30', { selector: '.ant-select-item-option-content' }));
    expect(input.value).toBe('');
    expect(getByText('30', { selector: '.ant-select-selection-item' })).toBeTruthy();

    await user.click(input);
    await user.type(input, '2');
    await user.tab();
    await waitFor(() => expect(input.value).toBe(''));
    expect(getByText('30', { selector: '.ant-select-selection-item' })).toBeTruthy();
  });
});

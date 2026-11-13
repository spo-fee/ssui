import React, { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from 'antd';
import IsolateLtrText from '../index';

it('透传 ref、原生属性和事件，并固定 LTR 方向', () => {
  const ref = createRef<HTMLElement>();
  const onMouseEnter = jest.fn();
  const onFocus = jest.fn();
  const { container, rerender } = render(
    <IsolateLtrText
      ref={ref}
      dir="rtl"
      className="amount"
      tabIndex={0}
      aria-label="balance"
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      -12.50 USD
    </IsolateLtrText>,
  );
  const span = container.firstElementChild as HTMLElement;
  expect(ref.current).toBe(span);
  expect(span.tagName).toBe('SPAN');
  expect(span.dir).toBe('ltr');
  expect(span.className).toBe('amount');
  expect(span.tabIndex).toBe(0);
  expect(span.getAttribute('aria-label')).toBe('balance');
  expect(span.textContent).toBe('-12.50 USD');
  fireEvent.mouseEnter(span);
  fireEvent.focus(span);
  expect(onMouseEnter).toHaveBeenCalledTimes(1);
  expect(onFocus).toHaveBeenCalledTimes(1);
  rerender(<IsolateLtrText ref={ref}>0 USD</IsolateLtrText>);
  expect(ref.current).toBe(span);
  expect(span.textContent).toBe('0 USD');
});

it('支持块级内容及 div ref', () => {
  const ref = createRef<HTMLDivElement>();
  const { container } = render(
    <IsolateLtrText as="div" ref={ref} className="chart">
      <div className="chart-content" />
    </IsolateLtrText>,
  );
  const div = container.firstElementChild as HTMLElement;
  expect(div.tagName).toBe('DIV');
  expect(div.dir).toBe('ltr');
  expect(div.className).toBe('chart');
  expect(div.firstElementChild?.className).toBe('chart-content');
  expect(ref.current).toBe(div);
});

it('支持原生链接、按钮、输入框及各自的属性和 ref', () => {
  const anchorRef = createRef<HTMLAnchorElement>();
  const buttonRef = createRef<HTMLButtonElement>();
  const inputRef = createRef<HTMLInputElement>();
  const { rerender } = render(
    <IsolateLtrText as="a" href="#amount" ref={anchorRef}>
      -12.50 USD
    </IsolateLtrText>,
  );
  expect(anchorRef.current).toBe(screen.getByRole('link'));
  expect(anchorRef.current?.getAttribute('href')).toBe('#amount');
  expect(anchorRef.current?.dir).toBe('ltr');
  rerender(
    <IsolateLtrText as="button" type="button" disabled ref={buttonRef}>
      -12.50 USD
    </IsolateLtrText>,
  );
  expect(buttonRef.current).toBe(screen.getByRole('button'));
  expect(buttonRef.current?.disabled).toBe(true);
  expect(buttonRef.current?.dir).toBe('ltr');
  rerender(
    <IsolateLtrText as="input" aria-label="amount" defaultValue="12.50" ref={inputRef} />,
  );
  expect(inputRef.current).toBe(screen.getByRole('textbox'));
  expect(inputRef.current?.value).toBe('12.50');
  expect(inputRef.current?.dir).toBe('ltr');
});

it('支持 SVG 原生标签与对应 ref', () => {
  const ref = createRef<SVGTextElement>();
  render(
    <svg>
      <IsolateLtrText as="text" x={10} y={20} ref={ref}>
        -12.50 USD
      </IsolateLtrText>
    </svg>,
  );
  expect(ref.current?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  expect(ref.current?.getAttribute('x')).toBe('10');
  expect(ref.current?.getAttribute('dir')).toBe('ltr');
});

describe('直接作为 Tooltip 子元素', () => {
  beforeEach(() => {
    return jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each(['hover', 'focus'] as const)('%s 触发显示和隐藏', (trigger) => {
    render(
      <Tooltip
        title="balance details"
        trigger={trigger}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        destroyTooltipOnHide
      >
        <IsolateLtrText tabIndex={0}>-12.50 USD</IsolateLtrText>
      </Tooltip>,
    );
    const span = screen.getByText('-12.50 USD');
    if (trigger === 'hover') {
      fireEvent.mouseEnter(span);
    } else {
      fireEvent.focus(span);
    }
    act(() => {
      return jest.runOnlyPendingTimers();
    });
    expect(screen.getByRole('tooltip').textContent).toBe('balance details');
    if (trigger === 'hover') {
      fireEvent.mouseLeave(span);
    } else {
      fireEvent.blur(span);
    }
    act(() => {
      return jest.runOnlyPendingTimers();
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

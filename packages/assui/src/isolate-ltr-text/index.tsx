import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  HTMLAttributes,
  JSX,
  ReactElement,
} from 'react';
import { createElement, forwardRef } from 'react';

export type IsolateLtrTextProps<Tag extends keyof JSX.IntrinsicElements = 'span'> = {
  /** 原生标签，默认 span；其余属性随标签推导。 */
  as?: Tag;
} & ComponentPropsWithoutRef<Tag> &
  (Tag extends 'span' ? unknown : { as: Tag });

/**
 * 通过原生 dir="ltr" 隔离数值片段或图表的展示方向。
 * 保留独立节点及自定义样式，不向文本添加方向控制字符。
 * 例如直接作为 Tooltip 子组件时，需要将其注入的鼠标、焦点事件和 ref
 * 传到实际原生元素，供提示触发与定位使用，
 * 避免调用方为了接收这些属性再包一层 span。
 * 包裹图表等块级内容时，使用 as="div"。
 */
const IsolateLtrText = forwardRef<
  Element,
  IsolateLtrTextProps<keyof JSX.IntrinsicElements>
>(({ children, as = 'span', ...rest }, ref) => {
  return createElement<HTMLAttributes<Element>, Element>(
    as,
    { ...rest, ref, dir: 'ltr' },
    children,
  );
});

IsolateLtrText.displayName = 'IsolateLtrText';

// forwardRef 不保留标签泛型，在公共调用签名中恢复属性和 ref 与 as 的对应关系。
export default IsolateLtrText as <Tag extends keyof JSX.IntrinsicElements = 'span'>(
  props: IsolateLtrTextProps<Tag> & Pick<ComponentPropsWithRef<Tag>, 'ref'>,
) => ReactElement | null;

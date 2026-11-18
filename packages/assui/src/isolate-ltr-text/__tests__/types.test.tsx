import React, { createRef } from 'react';
import IsolateLtrText, { type IsolateLtrTextProps } from '../index';

it('属性、事件和 ref 随 as 推导，省略 as 时按 span 检查', () => {
  const anchorProps: IsolateLtrTextProps<'a'> = { as: 'a', href: '#amount' };
  const anchor = (
    <IsolateLtrText
      {...anchorProps}
      ref={createRef<HTMLAnchorElement>()}
      onClick={(event) => {
        const href: string = event.currentTarget.href;
        expect(href).toBeDefined();
      }}
    >
      链接
    </IsolateLtrText>
  );
  const button = (
    <IsolateLtrText as="button" disabled ref={createRef<HTMLButtonElement>()}>
      按钮
    </IsolateLtrText>
  );
  // @ts-expect-error 默认 span 不支持 href。
  const invalidSpan = <IsolateLtrText href="#amount">文本</IsolateLtrText>;
  // @ts-expect-error 非默认标签的显式泛型也必须传 as，避免类型和实际 span 不一致。
  const missingAs = <IsolateLtrText<'a'> href="#amount" />;
  // @ts-expect-error 非默认标签的属性对象同样必须包含 as。
  const missingAsProps: IsolateLtrTextProps<'a'> = { href: '#amount' };
  const invalidButton = (
    // @ts-expect-error button 不支持 href。
    <IsolateLtrText as="button" href="#amount">
      按钮
    </IsolateLtrText>
  );
  const invalidRef = (
    // @ts-expect-error a 的 ref 必须对应 HTMLAnchorElement。
    <IsolateLtrText as="a" ref={createRef<HTMLButtonElement>()}>
      链接
    </IsolateLtrText>
  );
  const Custom = () => {
    return <span />;
  };
  // @ts-expect-error as 仅允许原生标签。
  const invalidComponent = <IsolateLtrText as={Custom} />;
  expect([
    anchor,
    button,
    invalidSpan,
    invalidButton,
    invalidRef,
    invalidComponent,
    missingAs,
    missingAsProps,
  ]).toHaveLength(8);
});

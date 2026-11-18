/**
 * title: 原生元素与 Fragment
 * desc: 原生元素及 Fragment 可直接作为 children；内容内部需要关闭时使用函数 children。
 */

import React from 'react';
import { Button, Space } from 'antd';
import { ButtonModal } from 'assui';

const NativeChildrenDemo = () => {
  return (
    <Space>
      <ButtonModal title="原生元素" trigger={<Button>原生元素</Button>}>
        <div>这是 div 内容</div>
      </ButtonModal>
      <ButtonModal title="Fragment" trigger={<Button>Fragment</Button>}>
        <>
          <div>这是第一段内容</div>
          <span>这是第二段内容</span>
        </>
      </ButtonModal>
      <ButtonModal title="内容内部关闭" trigger={<Button>内容内部关闭</Button>}>
        {(modalAction) => {
          return (
            <div>
              <p>这是 div 内容</p>
              <Button onClick={modalAction.close}>关闭</Button>
            </div>
          );
        }}
      </ButtonModal>
    </Space>
  );
};

export default NativeChildrenDemo;

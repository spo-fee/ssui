import * as React from 'react';
import CloseOutlined from 'a-icons/lib/CloseOutlined';
import isPromise from 'aa-utils/lib/isPromise';
import useControllableValue from 'ahooks/lib/useControllableValue';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import type { ModalProps } from 'antd/lib/modal';
import Modal from 'antd/lib/modal';
import isFunction from 'lodash/isFunction';

export interface ModalAction {
  open: () => void;
  close: () => void;
}

export interface ButtonModalProps extends Omit<ModalProps, 'children' | 'onOk'> {
  onClose?: () => void;
  onOpen?: () => void;
  onOk?: (v: React.MouseEvent<HTMLElement>) => void | Promise<void>;
  trigger?: ((fun: () => void) => React.ReactElement) | React.ReactElement;
  children: ((v: ModalAction) => React.ReactElement) | React.ReactElement;
}

const ButtonModal: React.ForwardRefRenderFunction<unknown, ButtonModalProps> = (
  props,
  ref,
) => {
  const [visible, setModalVisible] = useControllableValue(props, {
    valuePropName: 'open',
    defaultValue: false,
  });

  const { children, trigger, onOpen, onClose, onOk, onCancel, ...restModalProps } = props;

  const openModal = useMemoizedFn(() => {
    setModalVisible(true);
    onOpen?.();
  });

  const closeModal = useMemoizedFn(() => {
    setModalVisible(false);
    onClose?.();
  });

  const [modalAction] = React.useState<ModalAction>(() => {
    return {
      open: openModal,
      close: closeModal,
    };
  });

  React.useImperativeHandle(ref, () => {
    return modalAction;
  }, [modalAction]);

  const handleModalOk = async (e: React.MouseEvent<HTMLElement>) => {
    const result = onOk?.(e);
    if (isPromise(result)) {
      await result;
    }
    closeModal();
  };

  const handleModalCancel = (e: React.MouseEvent<HTMLElement>) => {
    onCancel?.(e);
    closeModal();
  };

  let triggerNode;
  if (isFunction(trigger)) {
    triggerNode = trigger(openModal);
  } else {
    triggerNode =
      trigger &&
      React.cloneElement(trigger, {
        onClick: openModal,
      });
  }

  let contentNode;
  if (isFunction(children)) {
    contentNode = children(modalAction);
  } else if (typeof children.type === 'string' || children.type === React.Fragment) {
    contentNode = children;
  } else {
    contentNode = React.cloneElement(children, { modalAction });
  }

  return (
    <>
      {triggerNode}
      <Modal
        open={visible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        centered
        maskClosable={false}
        closeIcon={<CloseOutlined />}
        {...restModalProps}
      >
        {contentNode}
      </Modal>
    </>
  );
};

const ForwardRefButtonModal = React.forwardRef<unknown, ButtonModalProps>(ButtonModal);

export default ForwardRefButtonModal;

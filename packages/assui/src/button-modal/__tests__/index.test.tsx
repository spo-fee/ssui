import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ButtonModal, { type ModalAction } from '../index';

interface NestedContentProps {
  modalAction?: ModalAction;
}

const Content = ({ modalAction }: any) => {
  return (
    <div>
      这是弹框内容
      <button
        type="button"
        onClick={() => {
          modalAction.close();
        }}
      >
        点击这里关闭弹框
      </button>
    </div>
  );
};

const baseProps = {
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onOk: jest.fn(),
  onCancel: jest.fn,
};

describe('ButtonModal', () => {
  it('ButtonModal base props should work fine ', async () => {
    const { getByText } = render(
      <ButtonModal title="demo" trigger={<span>open modal</span>} {...baseProps}>
        <Content />
      </ButtonModal>,
    );

    const button = getByText('open modal') as HTMLButtonElement;
    fireEvent.click(button);
    const boxes = await screen.findByText('这是弹框内容');
    expect(boxes).toBeTruthy();
    expect(baseProps.onOpen).toHaveBeenCalled();

    const okButton = await screen.findByText('OK');
    fireEvent.click(okButton);
    expect(baseProps.onOk).toHaveBeenCalled();

    // 点击 OK 会关闭弹窗（同时触发 onClose）：mask 应消失
    await waitFor(() => {
      const maskNode = screen.queryByText((_, element) => {
        return element?.className === 'ant-modal-mask';
      });
      expect(maskNode).toBeFalsy();
    });
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);

    // 重新打开，通过右上角关闭按钮关闭
    fireEvent.click(button);
    await screen.findByText('这是弹框内容');
    const closeButton = await screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    expect(baseProps.onClose).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      const maskNode1 = screen.queryByText((_, element) => {
        return element?.className === 'ant-modal-mask';
      });
      expect(maskNode1).toBeFalsy();
    });
  });

  it('ButtonModal base props should work fine ', async () => {
    const { getByText } = render(
      <ButtonModal title="demo" trigger={<span>open modal</span>}>
        <Content />
      </ButtonModal>,
    );

    const button = getByText('open modal') as HTMLButtonElement;
    fireEvent.click(button);
    expect(baseProps.onOpen).not.toHaveBeenCalled();

    const okButton = await screen.findByText('OK');
    fireEvent.click(okButton);
    expect(baseProps.onOk).not.toHaveBeenCalled();

    const closeButton = await screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it('ButtonModal ref should work fine ', async () => {
    const ref = React.createRef<ModalAction>();
    render(
      <ButtonModal ref={ref} title="demo" trigger={<span>open modal</span>}>
        <Content />
      </ButtonModal>,
    );
    act(() => {
      ref.current?.open();
    });

    const maskNode = await screen.queryByText((_, element) => {
      return element?.className === 'ant-modal-mask';
    });
    expect(maskNode).toBeTruthy();

    act(() => {
      ref.current?.close();
    });

    const maskNode1 = await screen.queryByText((_, element) => {
      return element?.className === 'ant-modal-mask';
    });
    expect(maskNode1).toBeFalsy();
  });

  it('if children is function should work fine ', async () => {
    const onClose = jest.fn();
    const childrenFunc = jest.fn((action: ModalAction) => {
      return (
        <button type="button" onClick={action.close}>
          close function content
        </button>
      );
    });
    render(
      <ButtonModal
        title="demo"
        trigger={<span>open modal</span>}
        onClose={onClose}
        destroyOnClose
      >
        {childrenFunc}
      </ButtonModal>,
    );
    fireEvent.click(screen.getByText('open modal'));
    fireEvent.click(await screen.findByText('close function content'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      return expect(screen.queryByText('close function content')).not.toBeInTheDocument();
    });
  });

  it.each(['div', 'span', 'form', 'svg'])(
    'renders native %s without action props',
    async (tag) => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onClose = jest.fn();
      try {
        render(
          <ButtonModal
            trigger={<button type="button">open native</button>}
            onClose={onClose}
            destroyOnClose
          >
            {React.createElement(
              tag,
              { 'data-testid': 'native-content', className: 'custom-content' },
              'native content',
            )}
          </ButtonModal>,
        );
        fireEvent.click(screen.getByText('open native'));
        const content = await screen.findByTestId('native-content');
        expect(content).toBeVisible();
        expect(content).toHaveClass('custom-content');
        expect(content).not.toHaveAttribute('modalAction');
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => {
          return expect(screen.queryByTestId('native-content')).not.toBeInTheDocument();
        });
        expect(
          consoleError.mock.calls.filter((args) => {
            return args.some((arg) => {
              return String(arg).includes('modalAction');
            });
          }),
        ).toEqual([]);
      } finally {
        consoleError.mockRestore();
      }
    },
  );

  it('renders fragments without injecting action into their children', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const nestedProps = jest.fn();
    const NestedContent = (props: NestedContentProps) => {
      nestedProps(props);
      return <span>nested content</span>;
    };
    try {
      render(
        <ButtonModal trigger={<button type="button">open fragment</button>}>
          <>
            <div>fragment content</div>
            <NestedContent />
          </>
        </ButtonModal>,
      );
      fireEvent.click(screen.getByText('open fragment'));
      expect(await screen.findByText('fragment content')).toBeVisible();
      expect(screen.getByText('nested content')).toBeVisible();
      expect(nestedProps).toHaveBeenCalled();
      expect(
        nestedProps.mock.calls.every(([props]) => {
          return props.modalAction === undefined;
        }),
      ).toBe(true);
      expect(
        consoleError.mock.calls.filter((args) => {
          return args.some((arg) => {
            return /modalAction|React.Fragment/.test(String(arg));
          });
        }),
      ).toEqual([]);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('keeps injected actions available to custom components', async () => {
    const onClose = jest.fn();
    render(
      <ButtonModal
        trigger={<button type="button">open custom</button>}
        onClose={onClose}
        destroyOnClose
      >
        <Content />
      </ButtonModal>,
    );
    fireEvent.click(screen.getByText('open custom'));
    fireEvent.click(await screen.findByText('点击这里关闭弹框'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      return expect(screen.queryByText('这是弹框内容')).not.toBeInTheDocument();
    });
  });

  it('keeps action references stable while calling the latest callbacks', async () => {
    const ref = React.createRef<ModalAction>();
    const initialOnOpen = jest.fn();
    const initialOnClose = jest.fn();
    const latestOnOpen = jest.fn();
    const latestOnClose = jest.fn();
    const renderContent = jest.fn((action: ModalAction) => {
      return <div>updated callback content</div>;
    });
    const { rerender } = render(
      <ButtonModal
        ref={ref}
        onOpen={initialOnOpen}
        onClose={initialOnClose}
        destroyOnClose
      >
        {renderContent}
      </ButtonModal>,
    );
    const originalAction = renderContent.mock.calls[0][0];
    const { open, close } = originalAction;
    expect(ref.current).toBe(originalAction);

    rerender(
      <ButtonModal ref={ref} onOpen={latestOnOpen} onClose={latestOnClose} destroyOnClose>
        {renderContent}
      </ButtonModal>,
    );
    act(() => {
      open();
    });
    expect(await screen.findByText('updated callback content')).toBeVisible();
    expect(latestOnOpen).toHaveBeenCalledTimes(1);
    expect(initialOnOpen).not.toHaveBeenCalled();

    act(() => {
      close();
    });
    await waitFor(() => {
      expect(screen.queryByText('updated callback content')).not.toBeInTheDocument();
    });
    expect(latestOnClose).toHaveBeenCalledTimes(1);
    expect(initialOnClose).not.toHaveBeenCalled();
    expect(ref.current).toBe(originalAction);
    expect(ref.current?.open).toBe(open);
    expect(ref.current?.close).toBe(close);
    expect(
      renderContent.mock.calls.every(([action]) => {
        return action === originalAction;
      }),
    ).toBe(true);
  });
});

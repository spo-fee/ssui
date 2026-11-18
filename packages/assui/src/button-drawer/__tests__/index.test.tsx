import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Button } from 'antd';
import '@testing-library/jest-dom';
import ButtonDrawer, { type DrawerAction } from '../index';

interface NestedContentProps {
  drawerAction?: DrawerAction;
}

const Content = ({ drawerAction }: any) => {
  return (
    <div>
      这是弹框内容
      <Button
        type="primary"
        onClick={() => {
          drawerAction.close();
        }}
      >
        点击这里关闭弹框
      </Button>
    </div>
  );
};

const baseProps = {
  onOpen: jest.fn(),
  onClose: jest.fn(),
};

describe('ButtonDrawer', () => {
  it('ButtonDrawer base props should work fine ', async () => {
    const { getByText, debug } = render(
      <ButtonDrawer
        title="demo"
        footer={null}
        trigger={<span>open modal</span>}
        {...baseProps}
      >
        <Content />
      </ButtonDrawer>,
    );

    const button = getByText('open modal') as HTMLButtonElement;

    fireEvent.click(button);

    const boxes = await screen.findByText('这是弹框内容');

    expect(boxes).toBeTruthy();
    expect(baseProps.onOpen).toHaveBeenCalled();

    const maskNode = await screen.queryByText((_, element) => {
      if (element?.className) {
        return element.className.toString().includes('ant-drawer ant-drawer-right');
      }
      return false;
    });

    expect(maskNode).toHaveClass('ant-drawer-open');

    const closeButton = await screen.getByLabelText('Close');

    fireEvent.click(closeButton);

    expect(baseProps.onClose).toHaveBeenCalled();

    expect(maskNode).not.toHaveClass('ant-drawer-open');
  });

  it('ButtonDrawer base props should work fine ', async () => {
    const { getByText } = render(
      <ButtonDrawer title="demo" trigger={<span>open modal</span>}>
        <Content />
      </ButtonDrawer>,
    );

    const button = getByText('open modal') as HTMLButtonElement;

    fireEvent.click(button);

    expect(baseProps.onOpen).not.toHaveBeenCalled();

    const closeButton = await screen.getByLabelText('Close');

    fireEvent.click(closeButton);

    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it('ButtonDrawer ref should work fine ', async () => {
    const ref = React.createRef<DrawerAction>();
    render(
      <ButtonDrawer ref={ref} title="demo" trigger={<span>open modal</span>}>
        <Content />
      </ButtonDrawer>,
    );
    act(() => {
      ref.current?.open();
    });

    const maskNode = await screen.queryByText((_, element) => {
      if (element?.className) {
        return element.className.toString().includes('ant-drawer ant-drawer-right');
      }
      return false;
    });

    expect(maskNode).toHaveClass('ant-drawer-open');

    act(() => {
      ref.current?.close();
    });

    expect(maskNode).not.toHaveClass('ant-drawer-open');
  });

  it('if children is function should work fine ', async () => {
    const onClose = jest.fn();
    const childrenFunc = jest.fn((action: DrawerAction) => {
      return (
        <button type="button" onClick={action.close}>
          close function content
        </button>
      );
    });
    render(
      <ButtonDrawer
        title="demo"
        trigger={<span>open modal</span>}
        onClose={onClose}
        destroyOnClose
      >
        {childrenFunc}
      </ButtonDrawer>,
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
          <ButtonDrawer
            trigger={<button type="button">open native</button>}
            onClose={onClose}
            destroyOnClose
          >
            {React.createElement(
              tag,
              { 'data-testid': 'native-content', className: 'custom-content' },
              'native content',
            )}
          </ButtonDrawer>,
        );
        fireEvent.click(screen.getByText('open native'));
        const content = await screen.findByTestId('native-content');
        expect(content).toBeVisible();
        expect(content).toHaveClass('custom-content');
        expect(content).not.toHaveAttribute('drawerAction');
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => {
          return expect(screen.queryByTestId('native-content')).not.toBeInTheDocument();
        });
        expect(
          consoleError.mock.calls.filter((args) => {
            return args.some((arg) => {
              return String(arg).includes('drawerAction');
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
        <ButtonDrawer trigger={<button type="button">open fragment</button>}>
          <>
            <div>fragment content</div>
            <NestedContent />
          </>
        </ButtonDrawer>,
      );
      fireEvent.click(screen.getByText('open fragment'));
      expect(await screen.findByText('fragment content')).toBeVisible();
      expect(screen.getByText('nested content')).toBeVisible();
      expect(nestedProps).toHaveBeenCalled();
      expect(
        nestedProps.mock.calls.every(([props]) => {
          return props.drawerAction === undefined;
        }),
      ).toBe(true);
      expect(
        consoleError.mock.calls.filter((args) => {
          return args.some((arg) => {
            return /drawerAction|React.Fragment/.test(String(arg));
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
      <ButtonDrawer
        trigger={<button type="button">open custom</button>}
        onClose={onClose}
        destroyOnClose
      >
        <Content />
      </ButtonDrawer>,
    );
    fireEvent.click(screen.getByText('open custom'));
    fireEvent.click(await screen.findByText('点击这里关闭弹框'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      return expect(screen.queryByText('这是弹框内容')).not.toBeInTheDocument();
    });
  });

  it('keeps action references stable while calling the latest callbacks', async () => {
    const ref = React.createRef<DrawerAction>();
    const initialOnOpen = jest.fn();
    const initialOnClose = jest.fn();
    const latestOnOpen = jest.fn();
    const latestOnClose = jest.fn();
    const renderContent = jest.fn((action: DrawerAction) => {
      return <div>updated callback content</div>;
    });
    const { rerender } = render(
      <ButtonDrawer
        ref={ref}
        onOpen={initialOnOpen}
        onClose={initialOnClose}
        destroyOnClose
      >
        {renderContent}
      </ButtonDrawer>,
    );
    const originalAction = renderContent.mock.calls[0][0];
    const { open, close } = originalAction;
    expect(ref.current).toBe(originalAction);

    rerender(
      <ButtonDrawer
        ref={ref}
        onOpen={latestOnOpen}
        onClose={latestOnClose}
        destroyOnClose
      >
        {renderContent}
      </ButtonDrawer>,
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

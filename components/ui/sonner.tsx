import * as React from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '@/src/components/theme-provider';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { ToastLoadingIcon } from '@/src/components/common/ToastLoadingIcon';
import { TOAST_ICON } from '@/lib/toastAssets';

function ToastStatusIcon({ src, spin }: { src: string; spin?: boolean }) {
  if (spin) {
    return <ToastLoadingIcon size={16} className="size-4" />;
  }
  return (
    <img
      src={src}
      alt=""
      width={16}
      height={16}
      className="size-4 shrink-0 object-contain"
      aria-hidden
    />
  );
}

const Toaster = ({
  closeButton = false,
  position = 'top-center',
  duration = 1600,
  visibleToasts = 1,
  expand = false,
  ...props
}: ToasterProps) => {
  const { theme = 'light' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      closeButton={closeButton}
      position={position}
      duration={duration}
      visibleToasts={visibleToasts}
      expand={expand}
      icons={{
        success: <ToastStatusIcon src={TOAST_ICON.success} />,
        info: <ToastStatusIcon src={TOAST_ICON.info} />,
        warning: <ToastStatusIcon src={TOAST_ICON.warning} />,
        error: <ToastStatusIcon src={TOAST_ICON.error} />,
        loading: <ToastStatusIcon src={TOAST_ICON.loading} spin />,
      }}
      style={
        {
          '--normal-bg': '#ffffff',
          '--normal-text': '#262626',
          '--normal-border': '#ebebeb',
          '--border-radius': '8px',
          '--width': 'auto',
        } as React.CSSProperties
      }
      toastOptions={{
        duration,
        classNames: {
          toast: 'cn-toast',
          title: 'cn-toast-title',
          success: 'cn-toast',
          error: 'cn-toast',
          warning: 'cn-toast',
          info: 'cn-toast',
          loading: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

/** 挂载到 document.body，避免侧栏/分栏布局影响 fixed 居中 */
function AppToaster(props: ToasterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(<Toaster {...props} />, document.body);
}

export { Toaster, AppToaster };

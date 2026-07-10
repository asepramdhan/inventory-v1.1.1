import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { Check, X, Info, AlertTriangle, Loader2 } from 'lucide-react';

function Toaster({ ...props }: ToasterProps) {
  const { appearance } = useAppearance();

  useFlashToast();

  return (
    <Sonner
      theme={appearance}
      className="toaster group"
      position="top-center"
      closeButton={false}
      icons={{
        success: (
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#61d345] text-white shrink-0 shadow-sm animate-in zoom-in-50 duration-300">
            <Check className="h-2.5 w-2.5 stroke-[3.5]" />
          </div>
        ),
        error: (
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#ff4b4b] text-white shrink-0 shadow-sm animate-in zoom-in-50 duration-300">
            <X className="h-2.5 w-2.5 stroke-[3.5]" />
          </div>
        ),
        warning: (
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-500 text-white shrink-0 shadow-sm animate-in zoom-in-50 duration-300">
            <AlertTriangle className="h-2.5 w-2.5 stroke-[3.5]" />
          </div>
        ),
        info: (
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-blue-500 text-white shrink-0 shadow-sm animate-in zoom-in-50 duration-300">
            <Info className="h-2.5 w-2.5 stroke-[3.5]" />
          </div>
        ),
        loading: <Loader2 className="h-[18px] w-[18px] text-zinc-500 dark:text-zinc-400 animate-spin shrink-0" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-zinc-900/95 group-[.toaster]:text-zinc-900 dark:group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-200/50 dark:group-[.toaster]:border-zinc-800/50 group-[.toaster]:shadow-[0_10px_25px_rgba(0,0,0,0.06),0_3px_10px_rgba(0,0,0,0.03)] dark:group-[.toaster]:shadow-[0_12px_30px_rgba(0,0,0,0.3)] group-[.toaster]:backdrop-blur-xl rounded-full py-2 px-3.5 font-sans border transition-all duration-300 flex gap-2.5 items-center relative overflow-hidden !w-fit mx-auto',
          title: 'font-medium text-[12.5px] text-zinc-900 dark:text-zinc-100 leading-none',
          description: 'text-zinc-500 dark:text-zinc-400 text-[11px] leading-none mt-0.5',
          success: '',
          error: '',
          info: '',
          warning: '',
          closeButton: 'hidden',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };


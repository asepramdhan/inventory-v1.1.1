import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
  const { appearance } = useAppearance();

  useFlashToast();

  return (
    <Sonner
      theme={appearance}
      className="toaster group"
      position="top-center"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background/80 group-[.toaster]:text-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-md rounded-xl p-4 font-sans text-xs border transition-all duration-300',
          title: 'font-bold text-foreground text-xs',
          description: 'group-[.toast]:text-muted-foreground text-[11px] mt-0.5',
          success: 'group-[.toaster]:border-emerald-500/20 group-[.toaster]:bg-emerald-50/70 dark:group-[.toaster]:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
          error: 'group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-50/70 dark:group-[.toaster]:bg-red-950/20 text-red-600 dark:text-red-400',
          info: 'group-[.toaster]:border-blue-500/20 group-[.toaster]:bg-blue-50/70 dark:group-[.toaster]:bg-blue-950/20 text-blue-600 dark:text-blue-400',
          warning: 'group-[.toaster]:border-amber-500/20 group-[.toaster]:bg-amber-50/70 dark:group-[.toaster]:bg-amber-950/20 text-amber-600 dark:text-amber-400',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            const titles: Record<string, string> = {
                success: 'Berhasil',
                error: 'Gagal',
                info: 'Informasi',
                warning: 'Peringatan'
            };
            const title = titles[data.type] || 'Pemberitahuan';

            toast[data.type](title, {
                description: data.message
            });
        });
    }, []);
}

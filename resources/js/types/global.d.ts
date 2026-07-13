import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            notifications?: Array<{
                id: string;
                type: 'product' | 'supply';
                title: string;
                message: string;
                link: string;
                severity: 'warning' | 'critical';
            }>;
            [key: string]: unknown;
        };
    }
}

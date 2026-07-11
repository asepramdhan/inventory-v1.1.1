import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, ShoppingBag, Box, BarChart3, ReceiptCent, PackagePlus } from 'lucide-react';
import { dashboard } from '@/routes';
import TransactionController from '@/actions/App/Http/Controllers/TransactionController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import MarginAnalysisController from '@/actions/App/Http/Controllers/MarginAnalysisController';
import FinancialMutationController from '@/actions/App/Http/Controllers/FinancialMutationController';
import ProducerStockController from '@/actions/App/Http/Controllers/ProducerStockController';

export function MobileBottomNav() {
    const { url } = usePage();

    const items = [
        {
            title: 'Dashboard',
            href: dashboard().url,
            icon: LayoutGrid,
        },
        {
            title: 'Transaksi',
            href: TransactionController.index().url,
            icon: ShoppingBag,
        },
        {
            title: 'Stok',
            href: ProductController.index().url,
            icon: Box,
        },
        {
            title: 'Faktur',
            href: ProducerStockController.index().url,
            icon: PackagePlus,
        },
        {
            title: 'Margin',
            href: MarginAnalysisController.index().url,
            icon: BarChart3,
        },
        {
            title: 'Mutasi',
            href: FinancialMutationController.index().url,
            icon: ReceiptCent,
        },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard' && url === '/dashboard') return true;
        if (href !== '/dashboard' && url.startsWith(href)) return true;
        return false;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center px-1 pb-safe z-50 shadow-lg">
            {items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.title}
                        href={item.href}
                        prefetch
                        className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                            active
                                ? 'text-indigo-650 dark:text-indigo-400 scale-105 font-bold'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-150'
                        }`}
                    >
                        <div className={`p-1 px-2.5 rounded-xl transition-all ${active ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[8.5px] tracking-tight mt-0.5 font-medium">{item.title}</span>
                    </Link>
                );
            })}
        </div>
    );
}

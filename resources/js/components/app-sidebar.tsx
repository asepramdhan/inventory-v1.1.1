import { Link, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Box, ChartBar, ClipboardList, Database, DollarSign, LayoutGrid, Megaphone, PackagePlus, ShoppingBagIcon, Store, Tags, Users, Camera } from 'lucide-react';
import AdsAffiliateController from '@/actions/App/Http/Controllers/AdsAffiliateController';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import FinancialMutationController from '@/actions/App/Http/Controllers/FinancialMutationController';
import MarginAnalysisController from '@/actions/App/Http/Controllers/MarginAnalysisController';
import OperationalSupplyController from '@/actions/App/Http/Controllers/OperationalSupplyController';
import ProducerController from '@/actions/App/Http/Controllers/ProducerController';
import ProducerStockController from '@/actions/App/Http/Controllers/ProducerStockController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import StoreController from '@/actions/App/Http/Controllers/StoreController';
import TransactionController from '@/actions/App/Http/Controllers/TransactionController';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    }
];

const transactionGroupItems: NavItem[] = [
    {
        title: 'Analisa & Keuangan',
        href: '#',
        icon: ChartBar,
        items: [
            {
                title: 'Analisa Margin',
                href: MarginAnalysisController.index(),
            },
            {
                title: 'Laporan Laba Rugi',
                href: '/finance/profit-loss',
            },
            {
                title: 'Mutasi Kas',
                href: FinancialMutationController.index(),
            }
        ]
    },
    {
        title: 'Penjualan & Gudang',
        href: '#',
        icon: ShoppingBagIcon,
        items: [
            {
                title: 'Riwayat Transaksi',
                href: TransactionController.index(),
            },
            {
                title: 'Stasiun Packing',
                href: '/finance/transactions/packing-station',
            },
            {
                title: 'Iklan & Affiliasi',
                href: AdsAffiliateController.index(),
            }
        ]
    }
];

const inventoryGroupItems: NavItem[] = [
    {
        title: 'Manajemen Stok',
        href: '#',
        icon: Box,
        items: [
            {
                title: 'Stok & Produk',
                href: ProductController.index(),
            },
            {
                title: 'Faktur Produsen',
                href: ProducerStockController.index(),
            },
            {
                title: 'Bahan Operasional',
                href: OperationalSupplyController.index(),
            }
        ]
    }
];

const systemGroupItems: NavItem[] = [
    {
        title: 'Master & Sistem',
        href: '#',
        icon: Database,
        items: [
            {
                title: 'Daftar Pelanggan',
                href: '/master-data/customers',
            },
            {
                title: 'Profil Produsen',
                href: ProducerController.index(),
            },
            {
                title: 'Kategori Produk',
                href: CategoryController.index(),
            },
            {
                title: 'Daftar Toko',
                href: StoreController.index(),
            },
            {
                title: 'Backup Database',
                href: '/master-data/backups',
            },
            {
                title: 'Kelola Pengguna',
                href: '/master-data/users',
            }
        ]
    }
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         href: 'https://github.com/laravel/react-starter-kit',
//         icon: FolderGit2,
//     },
//     {
//         title: 'Documentation',
//         href: 'https://laravel.com/docs/starter-kits#react',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    const { auth } = usePage<any>().props;
    const user = auth.user;
    const isAdmin = user?.role === 'admin';

    const hasPermission = (permission: string) => {
        if (isAdmin) return true;
        return Array.isArray(user?.permissions) && user.permissions.includes(permission);
    };

    // Filter transactionGroupItems dynamically
    const filteredTransactionItems = transactionGroupItems.map(group => {
        if (group.title === 'Analisa & Keuangan') {
            return isAdmin ? group : null;
        }
        if (group.title === 'Penjualan & Gudang') {
            const items = group.items?.filter(item => {
                if (item.title === 'Iklan & Affiliasi') return isAdmin;
                if (item.title === 'Riwayat Transaksi') return hasPermission('transactions');
                if (item.title === 'Stasiun Packing') return hasPermission('scanner');
                return true;
            });
            return items && items.length > 0 ? { ...group, items } : null;
        }
        return group;
    }).filter(Boolean) as NavItem[];

    // Filter inventoryGroupItems dynamically
    const filteredInventoryItems = inventoryGroupItems.map(group => {
        if (group.title === 'Manajemen Stok') {
            const items = group.items?.filter(item => {
                if (item.title === 'Stok & Produk') return hasPermission('products');
                if (item.title === 'Faktur Produsen') return hasPermission('products');
                if (item.title === 'Bahan Operasional') return hasPermission('supplies');
                return true;
            });
            return items && items.length > 0 ? { ...group, items } : null;
        }
        return group;
    }).filter(Boolean) as NavItem[];

    // Filter systemGroupItems dynamically
    const filteredSystemItems = systemGroupItems.map(group => {
        if (group.title === 'Master & Sistem') {
            const items = group.items?.filter(item => {
                if (item.title === 'Daftar Pelanggan') return hasPermission('customers');
                if (item.title === 'Profil Produsen') return hasPermission('products');
                if (item.title === 'Kategori Produk') return hasPermission('products');
                if (item.title === 'Daftar Toko') return isAdmin;
                if (item.title === 'Backup Database') return isAdmin;
                if (item.title === 'Kelola Pengguna') return isAdmin;
                return true;
            });
            return items && items.length > 0 ? { ...group, items } : null;
        }
        return group;
    }).filter(Boolean) as NavItem[];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="py-2">
                <NavMain items={mainNavItems} label="Utama" />
                {filteredTransactionItems.length > 0 && <NavMain items={filteredTransactionItems} label="Keuangan & Analisa" />}
                {filteredInventoryItems.length > 0 && <NavMain items={filteredInventoryItems} label="Operasional & Stok" />}
                {filteredSystemItems.length > 0 && <NavMain items={filteredSystemItems} label="Master Data & Sistem" />}
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

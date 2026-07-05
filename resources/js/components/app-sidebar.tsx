import { Link } from '@inertiajs/react';
import { ArrowRightLeft, Box, ChartBar, DollarSign, LayoutGrid, Megaphone, PackagePlus, ShoppingBagIcon, Store, Tags, Users } from 'lucide-react';
import AdsAffiliateController from '@/actions/App/Http/Controllers/AdsAffiliateController';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import FinancialMutationController from '@/actions/App/Http/Controllers/FinancialMutationController';
import MarginAnalysisController from '@/actions/App/Http/Controllers/MarginAnalysisController';
import ProducerController from '@/actions/App/Http/Controllers/ProducerController';
import ProducerStockController from '@/actions/App/Http/Controllers/ProducerStockController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import ProductHppController from '@/actions/App/Http/Controllers/ProductHppController';
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

const analysisItems: NavItem[] = [
    {
        title: 'Analisa Margin',
        href: MarginAnalysisController.index(),
        icon: ChartBar,
    },
    {
        title: 'Transaksi',
        href: TransactionController.index(),
        icon: ShoppingBagIcon,
    },
    {
        title: 'Iklan & Affiliasi',
        href: AdsAffiliateController.index(),
        icon: Megaphone,
    },
    {
        title: 'Mutasi Kas',
        href: FinancialMutationController.index(),
        icon: ArrowRightLeft,
    },
];

const oprationItems: NavItem[] = [
    {
        title: 'Faktur Produsen',
        href: ProducerStockController.index(),
        icon: PackagePlus,
    },
    {
        title: 'Stok & Produk',
        href: ProductController.index(),
        icon: Box,
    },
    {
        title: 'HPP Produk',
        href: ProductHppController.index(),
        icon: DollarSign,
    },
];

const masterDataItems: NavItem[] = [
    {
        title: 'Profil Produsen',
        href: ProducerController.index(),
        icon: Users,
    },
    {
        title: 'Kategori Produk',
        href: CategoryController.index(),
        icon: Tags,
    },
    {
        title: 'Daftar Toko',
        href: StoreController.index(),
        icon: Store,
    },
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
                {/* Panggil NavMain untuk masing-masing grup dan berikan labelnya */}
                <NavMain items={mainNavItems} label="Utama" />
                <NavMain items={analysisItems} label="Keuangan & Analisa" />
                <NavMain items={oprationItems} label="Stok & Pemasukan" />
                <NavMain items={masterDataItems} label="Master Data" />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

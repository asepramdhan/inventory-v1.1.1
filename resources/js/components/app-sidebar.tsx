import { Link } from '@inertiajs/react';
import { ArrowRightLeft, Box, ChartBar, DollarSign, LayoutGrid, Megaphone, ShoppingBagIcon, Store, Tags } from 'lucide-react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import StoreController from '@/actions/App/Http/Controllers/StoreController';
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
        href: '#',
        icon: ChartBar,
    },
    {
        title: 'Iklan & Affiliasi',
        href: '#',
        icon: Megaphone,
    },
    {
        title: 'Mutasi',
        href: '#',
        icon: ArrowRightLeft,
    },
    {
        title: 'Transaksi',
        href: '#',
        icon: ShoppingBagIcon,
    },
];

const masterDataItems: NavItem[] = [
    {
        title: 'Kategori',
        href: CategoryController.index(),
        icon: Tags,
    },
    {
        title: 'HPP',
        href: '#',
        icon: DollarSign,
    },
    {
        title: 'Produk',
        href: ProductController.index(),
        icon: Box,
    },
    {
        title: 'Toko',
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
                <NavMain items={mainNavItems} label="Main" />
                <NavMain items={analysisItems} label="Keuangan & Analisa" />
                <NavMain items={masterDataItems} label="Master Data" />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

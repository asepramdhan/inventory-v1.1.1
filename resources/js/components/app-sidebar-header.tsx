import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage, Link } from '@inertiajs/react';
import { Bell, AlertTriangle, AlertCircle, Package, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { notifications = [] } = usePage().props as any;
    const notificationCount = notifications.length;

    return (
        <header className="flex min-h-[4rem] h-auto pt-[env(safe-area-inset-top,0px)] pb-2 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 w-full sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Notification Bell Widget */}
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                        >
                            <Bell className="h-[18px] w-[18px] text-zinc-600 dark:text-zinc-400" />
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-background animate-pulse">
                                    {notificationCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[320px] sm:w-[380px] p-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 shadow-lg bg-white dark:bg-zinc-950">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 p-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Pemberitahuan Stok</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {notificationCount > 0 
                                        ? `Terdapat ${notificationCount} barang yang hampir habis` 
                                        : 'Semua stok dalam kondisi aman'}
                                </p>
                            </div>
                            {notificationCount > 0 && (
                                <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-bold rounded-full">
                                    Penting
                                </Badge>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {notificationCount > 0 ? (
                                notifications.map((notif: any) => {
                                    const isCritical = notif.severity === 'critical';
                                    return (
                                        <Link
                                            key={notif.id}
                                            href={notif.link}
                                            className="flex gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                                        >
                                            <div className="mt-0.5">
                                                {isCritical ? (
                                                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                                                        <AlertCircle className="h-4 w-4" />
                                                    </div>
                                                ) : (
                                                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                                                        <AlertTriangle className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                                        {notif.title}
                                                    </span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                                        isCritical 
                                                            ? 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20' 
                                                            : 'bg-amber-500/10 text-amber-650 dark:text-amber-450 border border-amber-500/20'
                                                    }`}>
                                                        {isCritical ? 'Habis' : 'Menipis'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-normal">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1.5">
                                                    <span>Update Stok</span>
                                                    <ArrowRight className="h-3 w-3" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Stok Barang Aman</h5>
                                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                                        Tidak ada produk maupun bahan operasional yang berada di bawah limit minimum.
                                    </p>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    );
}

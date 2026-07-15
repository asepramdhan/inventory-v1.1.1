import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { FloatingControlGroup } from '@/components/floating-control-group';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { CommandPalette } from '@/components/command-palette';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden pb-16 md:pb-0">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <FloatingControlGroup />
            <MobileBottomNav />
            <CommandPalette />
        </AppShell>
    );
}

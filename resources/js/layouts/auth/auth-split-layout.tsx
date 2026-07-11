import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Box, CheckCircle, TrendingUp, Users } from 'lucide-react';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props as { name: string };

    return (
        <div className="relative min-h-screen grid lg:grid-cols-2 lg:px-0 overflow-hidden bg-background">
            {/* Sisi Kiri (Hanya muncul di Desktop) */}
            <div className="relative hidden h-full flex-col bg-zinc-950 p-12 text-white lg:flex justify-between select-none">
                {/* Gradient Mesh Glow Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(245,158,11,0.12),transparent_40%)]" />
                <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl" />

                {/* Header Logo */}
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2.5 text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent group w-fit"
                >
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 group-hover:scale-105 transition-transform">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <span>{name}</span>
                </Link>

                {/* Center Content: Mockup Dashboard Visual */}
                <div className="relative z-20 my-auto max-w-lg space-y-8">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                            <Box className="size-3.5" />
                            Multi-Store Inventory Hub
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                            Kelola Stok & Penjualan Lebih{' '}
                            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
                                Cepat & Presisi
                            </span>
                        </h2>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                            Sinkronisasi inventaris multi-toko otomatis, hitung biaya operasional HPP secara real-time, dan cegah stok menipis sebelum kehabisan.
                        </p>
                    </div>

                    {/* Interactive Glassmorphic Widget Mockup */}
                    <div className="relative p-6 rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-zinc-300 font-mono">LIVE STATUS MONITOR</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">11 Jul 2026</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                    <TrendingUp className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Akurasi Stok</p>
                                    <p className="text-base font-bold text-white font-mono">99.9%</p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <CheckCircle className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sistem Status</p>
                                    <p className="text-base font-bold text-emerald-400 font-mono">Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 flex items-center justify-between text-xs text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Users className="size-3.5 text-amber-400" />
                                <span>Multi-Tenant Access</span>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-500">Secure AES-256</span>
                        </div>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="relative z-20 border-t border-white/10 pt-6">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        &copy; 2026 {name}. All rights reserved. Platform manajemen inventori ritel modern.
                    </p>
                </div>
            </div>

            {/* Sisi Kanan (Form Autentikasi) */}
            <div className="flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
                {/* Background light glow on mobile */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl lg:hidden" />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl lg:hidden" />

                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[360px] relative z-10">
                    {/* Mobile Logo Header */}
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 lg:hidden mb-2"
                    >
                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <AppLogoIcon className="size-6 fill-current text-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">{name}</span>
                    </Link>

                    {/* Form Title */}
                    <div className="flex flex-col gap-2 text-center lg:text-left">
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Children Inputs */}
                    <div className="grid gap-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

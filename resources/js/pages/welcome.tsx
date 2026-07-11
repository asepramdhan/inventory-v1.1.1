import { Head, Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';
import { ArrowRight, BarChart3, Box, CheckCircle, Database, Lock, ShoppingBag, Store, TrendingUp, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Welcome() {
    const { auth } = usePage().props as { auth: any };
    const todayDate = new Date().toISOString().split('T')[0];

    // State for interactive mockup stats
    const [liveOrders, setLiveOrders] = useState(148);
    const [liveItems, setLiveItems] = useState(2540);

    // Simulate real-time stock scan updates
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveOrders((prev) => prev + (Math.random() > 0.5 ? 1 : 0));
            setLiveItems((prev) => prev + (Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Head title="Platform Manajemen Inventori Ritel">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>{`
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                `}</style>
            </Head>

            <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 antialiased scroll-smooth selection:bg-indigo-500 selection:text-white relative overflow-hidden">
                {/* Ambient Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.06),transparent_45%)] blur-3xl pointer-events-none" />
                <div className="absolute top-[80vh] right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

                {/* Glassmorphic Navbar */}
                <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-900/60 transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-905 text-white flex items-center justify-center border border-zinc-800">
                                    <AppLogoIcon className="size-5 fill-current" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-650 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                                        Inventory
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 font-mono">
                                        v1.1.1
                                    </span>
                                </div>
                            </div>

                            {/* Actions Button */}
                            <div className="flex items-center gap-4">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="inline-flex items-center gap-1.5 justify-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95"
                                    >
                                        Dashboard
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            Masuk
                                        </Link>
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/10 active:scale-95"
                                        >
                                            Daftar Sekarang
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <main className="relative pt-16 pb-24 lg:pt-24 lg:pb-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
                        {/* Sub Header Badge */}
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-fade-in">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            Platform Ritel Terintegrasi
                        </span>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight">
                            Real-Time Stock Tracking & <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-indigo-600 via-indigo-400 to-amber-500 bg-clip-text text-transparent">
                                Multi-Store Management
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                            Sinkronisasikan stok gudang fisik, kelola inventaris e-commerce Shopee otomatis, hitung nilai HPP akurat, serta awasi persediaan bahan operasional tanpa repot.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href={auth.user ? dashboard() : login()}
                                className="px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/25 active:scale-95 flex items-center gap-2"
                            >
                                Kelola Inventori
                                <ArrowRight className="size-4" />
                            </Link>
                            <a
                                href="#features"
                                className="px-6 py-3.5 text-sm font-bold text-zinc-700 bg-zinc-200/80 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 active:scale-95 border border-zinc-300/30"
                            >
                                Jelajahi Fitur
                            </a>
                        </div>

                        {/* Live Dashboard Console & Analytics Mockup */}
                        <div className="mt-20 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-900 p-3 shadow-2xl max-w-5xl mx-auto relative group hover:border-indigo-500/20 transition-all duration-300">
                            {/* Inner Mockup Frame */}
                            <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-850 p-4 sm:p-6 text-left flex flex-col gap-6">
                                {/* Header Tab */}
                                <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                                        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                                        <span className="ml-2 text-zinc-500 font-mono text-[11px]">
                                            Monitor Panel // main-engine-node
                                        </span>
                                    </div>
                                    <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                        ● ONLINE CONNECTED
                                    </span>
                                </div>

                                {/* Analytics Metrics Box */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Stat 1 */}
                                    <div className="p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 flex items-center gap-4">
                                        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <ShoppingBag className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Total Pesanan</p>
                                            <p className="text-xl font-extrabold text-white font-mono">{liveOrders}</p>
                                        </div>
                                    </div>

                                    {/* Stat 2 */}
                                    <div className="p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 flex items-center gap-4">
                                        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                                            <Box className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Stok Produk Terindeks</p>
                                            <p className="text-xl font-extrabold text-white font-mono">{liveItems} pcs</p>
                                        </div>
                                    </div>

                                    {/* Stat 3 */}
                                    <div className="p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 flex items-center gap-4">
                                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <TrendingUp className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Akurasi Sinkronisasi</p>
                                            <p className="text-xl font-extrabold text-emerald-450 font-mono">100%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Terminal Console Log */}
                                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-850 font-mono text-[11px] sm:text-xs text-zinc-400 space-y-1.5 overflow-hidden select-none">
                                    <p className="text-zinc-500">[{todayDate}] Booting secure multi-store inventory engine...</p>
                                    <p className="text-indigo-400">&gt; Authenticating user session channels... [SECURE CONNECT]</p>
                                    <p className="text-zinc-300">&gt; E-Commerce platform Shopee: API channel listening [READY]</p>
                                    <p className="text-emerald-400">&gt; Checking auto-deduct rules for thermal paper and packaging envelopes...</p>
                                    <p className="text-amber-400">&gt; Alert manager: 0 stock deficit warnings pending. All levels safe.</p>
                                    <p className="text-zinc-650 animate-pulse">&gt; Daemon listening for checkout events... _</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Features Section */}
                <section id="features" className="py-24 border-t border-zinc-200/50 dark:border-zinc-900/50 bg-zinc-100/30 dark:bg-zinc-900/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Section Header */}
                        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Fitur Utama Platform</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
                                Arsitektur komprehensif yang memusatkan seluruh manajemen logistik ritel dan e-commerce dalam satu kendali terpadu.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:border-indigo-500/20 hover:-translate-y-1.5 transition-all duration-300 group">
                                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 group-hover:scale-105 transition-transform">
                                    <Store className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold mb-3">Integrasi Multi-Store</h3>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Hubungkan beberapa toko sekaligus, pisahkan pencatatan keuangan, dan sinkronkan data penjualan shopee dengan data transaksi manual gudang.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:border-indigo-500/20 hover:-translate-y-1.5 transition-all duration-300 group">
                                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-105 transition-transform">
                                    <BarChart3 className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold mb-3">Valuasi HPP & Laba</h3>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Deteksi otomatis Harga Pokok Penjualan (HPP) setiap produk. Hitung laba bersih secara detail setelah dipotong biaya admin toko dan biaya operasional.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:border-indigo-500/20 hover:-translate-y-1.5 transition-all duration-300 group">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold mb-3">Auto-Deduct Supplies</h3>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Kurangi otomatis stok kertas thermal atau lakban packing saat transaksi berhasil dibuat. Dapatkan warning alarm saat stok menipis secara real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Secure Badge Section */}
                <section className="py-16 bg-white dark:bg-zinc-950 border-t border-zinc-200/50 dark:border-zinc-900/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                <Lock className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-foreground">Aman & Terenkripsi</h3>
                                <p className="text-xs text-muted-foreground">Seluruh data inventori dan mutasi keuangan Anda diproteksi dengan sertifikasi keamanan modern.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold tracking-wider font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded px-2.5 py-1">SSL SECURE</span>
                            <span className="text-[10px] font-semibold tracking-wider font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded px-2.5 py-1">AES-256</span>
                            <span className="text-[10px] font-semibold tracking-wider font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded px-2.5 py-1">LARAVEL + INERTIA</span>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-zinc-200/50 dark:border-zinc-900/50 py-10 bg-zinc-100/20 dark:bg-zinc-950/20 text-xs sm:text-sm text-zinc-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <AppLogoIcon className="size-4 fill-current text-zinc-400" />
                            <p>&copy; 2026 Inventory. All rights reserved.</p>
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Kebijakan Privasi</a>
                            <a href="#" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Syarat & Ketentuan</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
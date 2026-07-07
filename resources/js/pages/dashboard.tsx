/* eslint-disable @stylistic/padding-line-between-statements */
import { Head } from '@inertiajs/react';
import { AlertCircle, DollarSign, Package, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Fungsi format rupiah
const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
};

// --- SKELETON LOADER UNTUK DASHBOARD ---
function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* 4 Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-sidebar-border/70"><CardContent className="p-6"><div className="h-4 bg-muted w-24 mb-4 rounded" /><div className="h-8 bg-muted w-32 rounded" /></CardContent></Card>
                ))}
            </div>
            {/* Chart & Stok Tipis Skeleton */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="md:col-span-4 border-sidebar-border/70"><CardContent className="h-[300px] p-6"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
                <Card className="md:col-span-3 border-sidebar-border/70"><CardContent className="h-[300px] p-6"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
            </div>
            {/* 2 Mini Tables Skeleton */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-sidebar-border/70"><CardContent className="h-[250px] p-6"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
                <Card className="border-sidebar-border/70"><CardContent className="h-[250px] p-6"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
            </div>
        </div>
    );
}

export default function Dashboard({ summary, stokTipis, transaksiTerbaru, mutasiTerbaru, chartData }: any) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 350);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title="Dashboard Utama" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                <div className="flex justify-between items-center">
                    <Heading title="Dashboard Overview" description="Ringkasan bisnis omnichannel Anda hari ini." />
                </div>

                {isLoading ? (
                    <DashboardSkeleton />
                ) : (
                    <div className="flex flex-col gap-6">

                        {/* ROW 1: WIDGET 4 KARTU RINGKASAN */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Omzet Bulan Ini</CardTitle><TrendingUp className="h-4 w-4 text-emerald-600" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-emerald-600">{formatIDR(summary.omzet)}</div></CardContent>
                            </Card>
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Profit Bersih Bulan Ini</CardTitle><DollarSign className="h-4 w-4 text-blue-600" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-blue-600">{formatIDR(summary.profit)}</div></CardContent>
                            </Card>
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Saldo Kas Berjalan</CardTitle><Wallet className="h-4 w-4 text-purple-600" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{formatIDR(summary.kas)}</div></CardContent>
                            </Card>
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Hutang Produsen</CardTitle><AlertCircle className="h-4 w-4 text-red-600" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold text-red-600">{formatIDR(summary.hutang)}</div></CardContent>
                            </Card>
                        </div>

                        {/* ROW 2: GRAFIK TREN (KIRI) & PERINGATAN STOK (KANAN) */}
                        <div className="grid gap-4 md:grid-cols-7">
                            {/* Grafik Tren Penjualan */}
                            <Card className="md:col-span-4 border-sidebar-border/70 shadow-sm">
                                <CardHeader>
                                    <CardTitle>Tren Penjualan 7 Hari Terakhir</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} />
                                            <Tooltip formatter={(value: any) => formatIDR(value)} />
                                            <Area type="monotone" dataKey="omzet" stroke="#10b981" strokeWidth={3} fill="url(#colorOmzet)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Widget Peringatan Stok Tipis (Request Anda!) */}
                            <Card className="md:col-span-3 border-sidebar-border/70 shadow-sm border-l-4 border-l-red-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" /> Peringatan Stok Tipis</CardTitle>
                                    <CardDescription>Barang yang hampir atau sudah habis.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {stokTipis.length === 0 ? (
                                            <div className="text-sm text-muted-foreground text-center py-8">Semua stok produk aman! 👍</div>
                                        ) : (
                                            stokTipis.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-muted rounded-md border flex items-center justify-center">
                                                            <Package className="h-5 w-5 text-muted-foreground/60" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold truncate max-w-[150px]">{item.name}</div>
                                                            <div className="text-xs text-muted-foreground">Sisa stok gudang</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold ${item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {item.stock} pcs
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ROW 3: TABEL TRANSAKSI TERBARU & MUTASI TERBARU */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Tabel Transaksi Mini */}
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> 5 Transaksi Penjualan Terbaru</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>No. Nota</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {transaksiTerbaru.map((tx: any) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="font-mono text-xs">{tx.invoice_number}</TableCell>
                                                    <TableCell className="text-right text-xs font-bold text-emerald-600">{formatIDR(tx.grand_total)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Tabel Mutasi Mini */}
                            <Card className="border-sidebar-border/70 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> 5 Mutasi Kas Terbaru</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="text-right">Nominal</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {mutasiTerbaru.map((mut: any) => (
                                                <TableRow key={mut.id}>
                                                    <TableCell className="text-xs font-semibold">{mut.category}</TableCell>
                                                    <TableCell className={`text-right text-xs font-extrabold ${mut.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {mut.type === 'income' ? '+' : '-'}{formatIDR(mut.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        { title: 'Utama', href: '#' },
        { title: 'Dashboard', href: DashboardController.index() },
    ],
};
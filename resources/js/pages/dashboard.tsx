/* eslint-disable @stylistic/padding-line-between-statements */
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, DollarSign, Package, ShoppingBag, TrendingUp, Truck, Wallet, XCircle, Coins } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Summary {
  omzet: number;
  profit: number;
  kas: number;
  hutang: number;
  profit_pending: number;
  profit_processing: number;
  profit_cancelled?: number;
  today_personal_expense?: number;
  month_personal_expense?: number;
}

interface ChartPoint {
  date: string;
  omzet: number;
  profit: number;
}

interface StokTipisItem {
  id: number;
  name: string;
  stock: number;
  image: string | null;
}

interface TransaksiItem {
  id: number;
  invoice_number: string;
  grand_total: number;
  transaction_date: string;
  store?: { name: string };
}

interface MutasiItem {
  id: number;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  created_at: string;
  account?: { name: string };
}

interface Props {
  summary: Summary;
  stokTipis: StokTipisItem[];
  transaksiTerbaru: TransaksiItem[];
  mutasiTerbaru: MutasiItem[];
  chartData: ChartPoint[];
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
};

const formatChartDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return { dateStr: '-', timeStr: '-' };
  const cleanDateString = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
  const date = new Date(cleanDateString);
  return {
    dateStr: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeStr: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
  };
};

const formatDateTimes = (dateString: string) => {
  if (!dateString) return { dateStr: '-', timeStr: '-' };
  const date = new Date(dateString);
  return {
    dateStr: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeStr: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
  };
};


const formatAxisIDR = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return String(value);
};

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-zinc-200 dark:bg-zinc-800" />
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-9 w-9 bg-muted rounded-lg" />
              </div>
              <div className="h-7 bg-muted rounded w-32" />
              <div className="h-3 bg-muted/60 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl"><CardContent className="h-[280px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
        <Card className="md:col-span-3 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl"><CardContent className="h-[280px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl"><CardContent className="h-[220px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
        <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl"><CardContent className="h-[220px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/60 dark:border-zinc-800/60 p-3.5 rounded-2xl shadow-xl space-y-2 min-w-[170px] text-xs">
        <p className="font-semibold text-zinc-500 dark:text-zinc-400">{formatChartDate(data.date)}</p>
        <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-2 mt-1.5">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.stroke || entry.color }} />
                {entry.name}
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">{formatIDR(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function Dashboard({ summary, stokTipis, transaksiTerbaru, mutasiTerbaru, chartData }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);


  const chartDisplayData = useMemo(
    () => chartData.map((item) => ({ ...item, dateLabel: formatChartDate(item.date) })),
    [chartData]
  );

  const hasChartData = chartDisplayData.some((d) => d.omzet > 0 || d.profit > 0);

  return (
    <>
      <Head title="Dashboard Utama" />
      <div className="flex flex-col gap-4 p-4">

        <Heading
          title="Ringkasan Dashboard"
          description="Pantau kondisi bisnis omnichannel Anda — omzet, profit, kas, dan stok hari ini."
        />

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-6">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Omzet Bulan Ini</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(summary.omzet)}</p>
                      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Transaksi bruto bulan berjalan</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Profit Bersih Bulan Ini</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(summary.profit)}</p>
                      <div className="pt-2 flex flex-col gap-1 text-[10.5px] border-t border-zinc-100 dark:border-zinc-800 border-dashed mt-2">
                        <div className="flex justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><Clock className="h-3 w-3" /> Pending / Packed</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.profit_pending)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400"><Truck className="h-3 w-3" /> Diproses</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.profit_processing)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400"><XCircle className="h-3 w-3" /> Gagal / Batal</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.profit_cancelled ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Saldo Kas Berjalan</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(summary.kas)}</p>
                      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Total saldo semua rekening aktif</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <Wallet className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-red-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Hutang Produsen</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(summary.hutang)}</p>
                      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Sisa tagihan produsen belum lunas</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
              <Card className="md:col-span-4 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tren Penjualan 7 Hari Terakhir</CardTitle>
                  <CardDescription className="text-xs">Omzet kotor vs profit bersih harian.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {!hasChartData ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Belum ada data penjualan 7 hari terakhir.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDisplayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dashColorOmzet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="dashColorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800/40" />
                        <XAxis dataKey="dateLabel" fontSize={11} tickLine={false} axisLine={false} className="fill-zinc-400 dark:fill-zinc-500" />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisIDR} width={48} className="fill-zinc-400 dark:fill-zinc-500" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#10b981" strokeWidth={2} fill="url(#dashColorOmzet)" activeDot={{ r: 4, strokeWidth: 0 }} />
                        <Area type="monotone" dataKey="profit" name="Profit" stroke="#6366f1" strokeWidth={2} fill="url(#dashColorProfit)" activeDot={{ r: 4, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-3 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-red-500" />
                <CardHeader className="pb-2.5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    Peringatan Stok Tipis
                  </CardTitle>
                  <CardDescription className="text-xs">Produk dengan sisa stok kritis (≤ 5 pcs).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                    {stokTipis.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <p className="text-xs text-muted-foreground">Semua stok produk aman.</p>
                      </div>
                    ) : (
                      stokTipis.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5 last:border-0 last:pb-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 p-1 rounded-xl transition-all duration-200">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg border border-zinc-200/60 dark:border-zinc-800 object-cover shrink-0 transition-transform duration-300 hover:scale-105" />
                            ) : (
                              <div className="h-10 w-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-zinc-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100 truncate">{item.name}</p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Sisa stok gudang</p>
                            </div>
                          </div>
                          <DashboardStockUpdater item={item} />
                        </div>
                      ))
                    )}
                  </div>
                  {stokTipis.length > 0 && (
                    <Link href={ProductController.index()} className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline mt-3">
                      Kelola produk <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                <CardHeader className="pb-2.5 flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <ShoppingBag className="h-4 w-4 text-emerald-500" />
                    Transaksi Penjualan Terbaru
                  </CardTitle>
                  <Link href="/finance/transactions" className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5">
                    Lihat semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
                      <TableRow>
                        <TableHead className="text-xs">Tanggal</TableHead>
                        <TableHead className="text-xs">No. Nota</TableHead>
                        <TableHead className="text-xs">Toko</TableHead>
                        <TableHead className="text-xs text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transaksiTerbaru.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                            Belum ada transaksi penjualan.
                          </TableCell>
                        </TableRow>
                      ) : (
                        transaksiTerbaru.map((tx) => (
                          <TableRow key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                            <TableCell className="py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{formatDateTime(tx.transaction_date).dateStr}</span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Pukul {formatDateTime(tx.transaction_date).timeStr}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-0.5 px-2 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">{tx.invoice_number}</span>
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className="inline-block max-w-[100px] truncate bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-0.5 px-2 rounded-full text-[10px] font-medium border border-zinc-200/30 dark:border-zinc-700/30">{tx.store?.name || '-'}</span>
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-600">{formatIDR(tx.grand_total)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                <CardHeader className="pb-2.5 flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Wallet className="h-4 w-4 text-purple-500" />
                    Mutasi Kas Terbaru
                  </CardTitle>
                  <Link href="/finance/mutations" className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5">
                    Lihat semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
                      <TableRow>
                        <TableHead className="text-xs">Tanggal</TableHead>
                        <TableHead className="text-xs">Kategori</TableHead>
                        <TableHead className="text-xs">Akun</TableHead>
                        <TableHead className="text-xs text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mutasiTerbaru.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                            Belum ada mutasi kas.
                          </TableCell>
                        </TableRow>
                      ) : (
                        mutasiTerbaru.map((mut) => (
                          <TableRow key={mut.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                            <TableCell className="py-2.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{formatDateTimes(mut.created_at).dateStr}</span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Pukul {formatDateTimes(mut.created_at).timeStr}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{mut.category}</TableCell>
                            <TableCell className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[90px]">{mut.account?.name || '-'}</TableCell>
                            <TableCell className="text-right py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${mut.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                {mut.type === 'income' ? '+' : '-'}{formatIDR(mut.amount)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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

function DashboardStockUpdater({ item }: { item: StokTipisItem }) {
  const [open, setOpen] = useState(false);
  const [stockVal, setStockVal] = useState(item.stock?.toString() || '0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStockVal(item.stock?.toString() || '0');
  }, [item.stock]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    router.put(
      `/operational/product/${item.id}/update-stock`,
      {
        stock: parseInt(stockVal) || 0,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
        },
        onFinish: () => setLoading(false),
      }
    );
  };

  const isOutOfStock = item.stock === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={`cursor-pointer px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border transition-all duration-200 hover:scale-105 ${
            isOutOfStock
              ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
              : 'bg-amber-500/10 text-amber-605 border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          {item.stock} pcs
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-56 p-3 z-50 shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-xl"
        onClick={(e) => e.stopPropagation()}
        align="end"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Pembaruan Stok Cepat</h4>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-150 truncate max-w-[190px]">{item.name}</p>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={stockVal}
              onChange={(e) => setStockVal(e.target.value)}
              className="h-8 text-xs rounded-lg"
              min="0"
              required
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
            <Button size="sm" className="h-8 px-3 rounded-lg text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white" type="submit" disabled={loading}>
              {loading ? '...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

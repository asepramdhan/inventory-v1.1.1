/* eslint-disable @stylistic/padding-line-between-statements */
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, DollarSign, Package, ShoppingBag, TrendingUp, Truck, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Summary {
  omzet: number;
  profit: number;
  kas: number;
  hutang: number;
  profit_pending: number;
  profit_processing: number;
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
          <Card key={i} className="border-l-4 border-l-muted shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-9 w-9 bg-muted rounded-full" />
              </div>
              <div className="h-7 bg-muted rounded w-32" />
              <div className="h-3 bg-muted/60 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm"><CardContent className="h-[280px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
        <Card className="md:col-span-3 shadow-sm"><CardContent className="h-[280px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm"><CardContent className="h-[220px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="h-[220px] p-4"><div className="h-full bg-muted/30 rounded" /></CardContent></Card>
      </div>
    </div>
  );
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
              <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Omzet Bulan Ini</p>
                    <p className="text-xl font-black text-emerald-600 tracking-tight">{formatIDR(summary.omzet)}</p>
                    <p className="text-[10px] text-muted-foreground">Transaksi bruto bulan berjalan</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-600">Profit Bersih Bulan Ini</p>
                    <p className="text-xl font-black text-blue-600 tracking-tight">{formatIDR(summary.profit)}</p>
                    <div className="pt-1 flex flex-col gap-0.5 text-[10px] border-t border-dashed mt-1">
                      <div className="flex justify-between gap-2">
                        <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3 w-3" /> Pending</span>
                        <span className="font-bold text-amber-600">{formatIDR(summary.profit_pending)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="flex items-center gap-1 text-indigo-600"><Truck className="h-3 w-3" /> Diproses</span>
                        <span className="font-bold text-indigo-600">{formatIDR(summary.profit_processing)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Saldo Kas Berjalan</p>
                    <p className="text-xl font-black text-purple-600 tracking-tight">{formatIDR(summary.kas)}</p>
                    <p className="text-[10px] text-muted-foreground">Total saldo semua rekening aktif</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Hutang Produsen</p>
                    <p className="text-xl font-black text-red-600 tracking-tight">{formatIDR(summary.hutang)}</p>
                    <p className="text-[10px] text-muted-foreground">Sisa tagihan produsen belum lunas</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
              <Card className="md:col-span-4 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Tren Penjualan 7 Hari Terakhir</CardTitle>
                  <CardDescription className="text-xs">Omzet kotor vs profit bersih harian.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {!hasChartData ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      Belum ada data penjualan 7 hari terakhir.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartDisplayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dashColorOmzet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="dashColorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                        <XAxis dataKey="dateLabel" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisIDR} width={48} />
                        <Tooltip
                          formatter={(value) => formatIDR(Number(value ?? 0))}
                          labelFormatter={(_, payload) => {
                            const raw = payload?.[0]?.payload?.date;
                            return raw ? formatChartDate(raw) : '';
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#10b981" strokeWidth={2} fill="url(#dashColorOmzet)" />
                        <Area type="monotone" dataKey="profit" name="Profit" stroke="#2563eb" strokeWidth={2} fill="url(#dashColorProfit)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-3 shadow-sm border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Peringatan Stok Tipis
                  </CardTitle>
                  <CardDescription className="text-xs">Produk dengan stok ≤ 5 pcs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                    {stokTipis.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <p className="text-xs text-muted-foreground">Semua stok produk aman.</p>
                      </div>
                    ) : (
                      stokTipis.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-10 w-10 rounded-md border object-cover shrink-0" />
                            ) : (
                              <div className="h-10 w-10 bg-muted rounded-md border flex items-center justify-center shrink-0">
                                <Package className="h-4 w-4 text-muted-foreground/60" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">Sisa stok gudang</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${item.stock === 0 ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                            {item.stock} pcs
                          </span>
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
              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Transaksi Penjualan Terbaru
                  </CardTitle>
                  <Link href="/finance/transactions" className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5">
                    Lihat semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <Table>
                    <TableHeader className="bg-muted/40">
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
                          <TableRow key={tx.id} className="hover:bg-muted/10">
                            <TableCell className="py-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium">{formatDateTime(tx.transaction_date).dateStr}</span>
                                <span className="text-[10px] text-muted-foreground italic">Pukul {formatDateTime(tx.transaction_date).timeStr}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{tx.invoice_number}</TableCell>
                            <TableCell className="text-xs truncate max-w-[100px]">{tx.store?.name || '-'}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-600">{formatIDR(tx.grand_total)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Mutasi Kas Terbaru
                  </CardTitle>
                  <Link href="/finance/mutations" className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5">
                    Lihat semua <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <Table>
                    <TableHeader className="bg-muted/40">
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
                          <TableRow key={mut.id} className="hover:bg-muted/10">
                            <TableCell className="py-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium">{formatDateTimes(mut.created_at).dateStr}</span>
                                <span className="text-[10px] text-muted-foreground italic">Pukul {formatDateTimes(mut.created_at).timeStr}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{mut.category}</TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-[90px]">{mut.account?.name || '-'}</TableCell>
                            <TableCell className={`text-right text-xs font-bold ${mut.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {mut.type === 'income' ? '+' : '-'}{formatIDR(mut.amount)}
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

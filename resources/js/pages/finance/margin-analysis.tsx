/* eslint-disable react-hooks/set-state-in-effect */
import { Head, router } from '@inertiajs/react';
import { Calendar, Clock, DollarSign, Percent, ShoppingBag, TrendingUp, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import MarginAnalysisController from '@/actions/App/Http/Controllers/MarginAnalysisController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  summary: {
    total_omzet: number;
    total_admin_fee: number;
    total_hpp: number;
    total_affiliate_fee: number;
    total_ads_fee: number;
    net_profit: number;
    average_margin_percentage: number;
    profit_pending: number;
    profit_processing: number;
  };
  trendData: Array<{ date: string; omzet: number; net_profit: number }>;
  storePerformance: Array<{ store_name: string; platform: string; omzet: number; net_profit: number; margin_percentage: number }>;
  productPerformance: Array<{ product_name: string; product_sku: string; total_qty: number; gross_sales: number; gross_profit: number; margin_percentage: number }>;
  storesList: Array<{ id: number; name: string; platform: string }>;
  filters: {
    start_date: string;
    end_date: string;
    store_id: string;
  };
}

function MarginAnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader><div className="h-5 bg-muted rounded w-44" /></CardHeader>
          <CardContent className="h-[280px]"><div className="h-full bg-muted/30 rounded" /></CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader><div className="h-5 bg-muted rounded w-44" /></CardHeader>
          <CardContent className="h-[280px]"><div className="h-full bg-muted/30 rounded" /></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-3">
          <Table>
            <TableBody>
              {[1, 2, 3].map((row) => (
                <TableRow key={row}>
                  <TableCell><div className="h-4 bg-muted rounded w-32" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-20 ml-auto" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-20 ml-auto" /></TableCell>
                  <TableCell><div className="h-5 bg-muted rounded w-12 mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MarginAnalysis({ summary, trendData, storePerformance, productPerformance, storesList, filters }: Props) {
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [storeId, setStoreId] = useState(String(filters.store_id ?? 'all'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setStartDate(filters.start_date);
    setEndDate(filters.end_date);
    setStoreId(String(filters.store_id ?? 'all'));
  }, [filters.start_date, filters.end_date, filters.store_id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get(
        MarginAnalysisController.index(),
        { start_date: startDate, end_date: endDate, store_id: storeId },
        { preserveState: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [startDate, endDate, storeId]);

  const totalBeban = summary.total_hpp + summary.total_admin_fee + summary.total_affiliate_fee + summary.total_ads_fee;
  const hasActiveFilters = storeId !== 'all';

  const handleResetFilters = () => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setStoreId('all');
  };

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatAxisIDR = (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} jt`;
    if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} rb`;
    return String(value);
  };

  const formatChartDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const getMarginStyle = (margin: number) => {
    if (margin >= 20) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (margin >= 10) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const marginStatus = summary.average_margin_percentage >= 20
    ? { label: 'Sehat', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    : summary.average_margin_percentage >= 10
      ? { label: 'Waspada', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
      : { label: 'Tipis', className: 'bg-red-500/10 text-red-600 border-red-500/20' };

  const chartTrendData = useMemo(
    () => trendData.map((item) => ({ ...item, dateLabel: formatChartDate(item.date) })),
    [trendData]
  );

  return (
    <>
      <Head title="Analisa Margin & Profit" />

      <div className="flex flex-col gap-4 p-4">
        <Heading
          title="Analisa Margin"
          description="Pantau profitabilitas riil toko dan produk Anda setelah dipotong beban HPP, admin marketplace, dan biaya affiliate."
        />

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs border rounded-md px-2 h-9 w-full sm:w-[150px] outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs border rounded-md px-2 h-9 w-full sm:w-[150px] outline-none focus:ring-1 focus:ring-ring"
            />
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs">
                <SelectValue placeholder="Semua Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {storesList.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name} ({store.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-xs h-9" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <MarginAnalysisSkeleton />
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total Omzet</p>
                    <p className="text-xl font-black text-blue-600 tracking-tight">{formatIDR(summary.total_omzet)}</p>
                    <p className="text-[10px] text-muted-foreground">Akumulasi transaksi bruto (kotor)</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total Beban & Biaya</p>
                    <p className="text-xl font-black text-red-600 tracking-tight">{formatIDR(totalBeban)}</p>
                    <div className="pt-1 flex flex-col gap-0.5 text-[10px] text-muted-foreground border-t border-dashed mt-1">
                      <div className="flex justify-between gap-2">
                        <span>HPP</span>
                        <span className="font-medium text-foreground">{formatIDR(summary.total_hpp)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Admin</span>
                        <span className="font-medium text-foreground">{formatIDR(summary.total_admin_fee)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Iklan</span>
                        <span className="font-medium text-purple-600">{formatIDR(summary.total_ads_fee)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Affiliate</span>
                        <span className="font-medium text-indigo-600">{formatIDR(summary.total_affiliate_fee)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600">Profit Riil (Selesai)</p>
                    <p className="text-xl font-black text-emerald-600 tracking-tight">{formatIDR(summary.net_profit)}</p>
                    <div className="pt-1 flex flex-col gap-1 text-[10px] border-t border-dashed border-emerald-500/20 mt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                        <span className="font-bold text-amber-600">{formatIDR(summary.profit_pending)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-blue-600">
                          <Truck className="h-3 w-3" />
                          Diproses
                        </span>
                        <span className="font-bold text-blue-600">{formatIDR(summary.profit_processing)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Rata-Rata Margin</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-amber-600 tracking-tight">{summary.average_margin_percentage}%</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${marginStatus.className}`}>
                        {marginStatus.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Target sehat &gt; 20% dari omzet</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Percent className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
              <Card className="lg:col-span-4 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Tren Pertumbuhan Profit Harian</CardTitle>
                  <CardDescription className="text-xs">Komparasi omzet kotor vs laba bersih riil per hari.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] pl-2">
                  {chartTrendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      Tidak ada data tren pada periode ini.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                        <XAxis dataKey="dateLabel" className="text-[10px]" stroke="#888888" />
                        <YAxis className="text-[10px]" stroke="#888888" tickFormatter={formatAxisIDR} width={48} />
                        <Tooltip
                          formatter={(value) => formatIDR(Number(value ?? 0))}
                          labelFormatter={(_, payload) => {
                            const raw = payload?.[0]?.payload?.date;
                            return raw ? formatChartDate(raw) : '';
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#2563eb" fillOpacity={1} fill="url(#colorOmzet)" strokeWidth={2} />
                        <Area type="monotone" dataKey="net_profit" name="Profit Bersih" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Performa Profit Antar Toko</CardTitle>
                  <CardDescription className="text-xs">Perbandingan omzet vs profit bersih per toko.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {storePerformance.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      Tidak ada data toko pada periode ini.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={storePerformance} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                        <XAxis type="number" className="text-[10px]" stroke="#888888" tickFormatter={formatAxisIDR} />
                        <YAxis dataKey="store_name" type="category" className="text-[10px] font-medium" stroke="#888888" width={72} />
                        <Tooltip formatter={(value) => formatIDR(Number(value ?? 0))} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="omzet" name="Omzet" fill="#93c5fd" radius={[0, 4, 4, 0]} barSize={10} />
                        <Bar dataKey="net_profit" name="Profit Bersih" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Performa Profit per Toko</p>
              <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-3">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs">Nama Toko</TableHead>
                        <TableHead className="text-xs">Platform</TableHead>
                        <TableHead className="text-xs text-right">Omzet</TableHead>
                        <TableHead className="text-xs text-right">Profit Bersih</TableHead>
                        <TableHead className="text-xs text-center w-[90px]">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storePerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                            Tidak ada data performa toko pada periode ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        storePerformance.map((store) => (
                          <TableRow key={`${store.store_name}-${store.platform}`} className="hover:bg-muted/10">
                            <TableCell className="text-xs font-bold">{store.store_name}</TableCell>
                            <TableCell>
                              <Badge className="bg-sky-50 text-sky-700 capitalize text-[10px]">{store.platform}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">{formatIDR(store.omzet)}</TableCell>
                            <TableCell className="text-xs text-right font-bold text-emerald-600">{formatIDR(store.net_profit)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMarginStyle(store.margin_percentage)}`}>
                                {store.margin_percentage}%
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

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">Top 10 Produk — Kontribusi Profit</p>
              <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground mb-3 pb-2 border-b border-dashed">
                    Diurutkan berdasarkan profit kotor terbesar (penjualan produk dikurangi HPP pokok).
                  </p>
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs max-w-[280px]">Nama Produk</TableHead>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs text-center">Terjual</TableHead>
                        <TableHead className="text-xs text-right">Total Penjualan</TableHead>
                        <TableHead className="text-xs text-right text-emerald-600 font-bold">Profit Kotor (HPP)</TableHead>
                        <TableHead className="text-xs text-center">Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productPerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                            Tidak ada data transaksi produk pada periode ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        productPerformance.map((item, index) => (
                          <TableRow key={index} className="hover:bg-muted/10">
                            <TableCell className="font-medium text-xs max-w-[280px] truncate" title={item.product_name}>
                              {item.product_name}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{item.product_sku || '-'}</TableCell>
                            <TableCell className="text-center text-xs font-semibold">{item.total_qty} pcs</TableCell>
                            <TableCell className="text-right text-xs">{formatIDR(item.gross_sales)}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-600">{formatIDR(item.gross_profit)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMarginStyle(item.margin_percentage)}`}>
                                {item.margin_percentage}%
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
          </>
        )}
      </div>
    </>
  );
}

MarginAnalysis.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Analisa Margin', href: MarginAnalysisController.index() },
  ],
};

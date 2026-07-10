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

const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatChartDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

const formatAxisIDR = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return String(value);
};

function MarginAnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl">
          <CardHeader><div className="h-5 bg-muted rounded w-44" /></CardHeader>
          <CardContent className="h-[280px]"><div className="h-full bg-muted/30 rounded" /></CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl">
          <CardHeader><div className="h-5 bg-muted rounded w-44" /></CardHeader>
          <CardContent className="h-[280px]"><div className="h-full bg-muted/30 rounded" /></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl">
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

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border border-zinc-200/60 dark:border-zinc-800/60 p-3.5 rounded-2xl shadow-xl space-y-2 min-w-[170px] text-xs">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
        <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-2 mt-1.5">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
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

  const getMarginStyle = (margin: number) => {
    if (margin >= 20) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/10';
    if (margin >= 10) return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/10';
    return 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/5 dark:border-red-500/10';
  };

  const marginStatus = summary.average_margin_percentage >= 20
    ? { label: 'Sehat', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/5 dark:border-emerald-500/10' }
    : summary.average_margin_percentage >= 10
      ? { label: 'Waspada', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/10' }
      : { label: 'Tipis', className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/5 dark:border-red-500/10' };

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

        <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl px-3 h-10">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs outline-none text-zinc-700 dark:text-zinc-200 w-[120px]"
              />
              <span className="text-xs text-zinc-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs outline-none text-zinc-700 dark:text-zinc-200 w-[120px]"
              />
            </div>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="w-full sm:w-[220px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                <SelectValue placeholder="Semua Toko" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Toko</SelectItem>
                {storesList.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name} ({store.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-xs h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={handleResetFilters}>
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
              <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Total Omzet</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(summary.total_omzet)}</p>
                    <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Akumulasi transaksi bruto (kotor)</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-red-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Total Beban & Biaya</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(totalBeban)}</p>
                    <div className="pt-2 flex flex-col gap-1 text-[10.5px] border-t border-zinc-100 dark:border-zinc-800 border-dashed mt-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-zinc-500 dark:text-zinc-400">HPP Pokok</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.total_hpp)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Admin Marketplace</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.total_admin_fee)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Biaya Iklan</span>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{formatIDR(summary.total_ads_fee)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Komisi Affiliate</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatIDR(summary.total_affiliate_fee)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Profit Riil (Selesai)</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatIDR(summary.net_profit)}</p>
                    <div className="pt-2 flex flex-col gap-1 text-[10.5px] border-t border-zinc-100 dark:border-zinc-800 border-dashed mt-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.profit_pending)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <Truck className="h-3 w-3" />
                          Diproses
                        </span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatIDR(summary.profit_processing)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 group-hover:h-1.5 transition-all duration-200" />
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Rata-Rata Margin</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{summary.average_margin_percentage}%</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${marginStatus.className}`}>
                        {marginStatus.label}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Target sehat &gt; 20% dari omzet</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Percent className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
              <Card className="lg:col-span-4 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tren Pertumbuhan Profit Harian</CardTitle>
                  <CardDescription className="text-xs">Komparasi omzet kotor vs laba bersih riil per hari.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] pl-2">
                  {chartTrendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Tidak ada data tren pada periode ini.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-zinc-100 dark:stroke-zinc-800/40" />
                        <XAxis dataKey="dateLabel" fontSize={11} tickLine={false} axisLine={false} className="fill-zinc-400 dark:fill-zinc-500" />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAxisIDR} width={48} className="fill-zinc-400 dark:fill-zinc-500" />
                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ backgroundColor: 'transparent', border: 'none' }} contentStyle={{ backgroundColor: 'transparent', border: 'none' }} cursor={{ stroke: 'rgba(120, 120, 120, 0.2)', strokeWidth: 1 }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOmzet)" strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0 }} />
                        <Area type="monotone" dataKey="net_profit" name="Profit Bersih" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} activeDot={{ r: 4, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Performa Profit Antar Toko</CardTitle>
                  <CardDescription className="text-xs">Perbandingan omzet vs profit bersih per toko.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  {storePerformance.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Tidak ada data toko pada periode ini.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={storePerformance} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="4 4" className="stroke-zinc-100 dark:stroke-zinc-800/40" horizontal={false} />
                        <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} className="fill-zinc-400 dark:fill-zinc-500" tickFormatter={formatAxisIDR} />
                        <YAxis dataKey="store_name" type="category" fontSize={11} tickLine={false} axisLine={false} className="fill-zinc-700 dark:fill-zinc-300 font-medium" width={72} />
                        <Tooltip content={<CustomBarTooltip />} wrapperStyle={{ backgroundColor: 'transparent', border: 'none' }} contentStyle={{ backgroundColor: 'transparent', border: 'none' }} cursor={{ fill: 'rgba(120, 120, 120, 0.08)' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="omzet" name="Omzet" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={8} opacity={0.8} />
                        <Bar dataKey="net_profit" name="Profit Bersih" fill="#10b981" radius={[0, 4, 4, 0]} barSize={8} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Performa Profit per Toko</p>
              <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
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
                          <TableRow key={`${store.store_name}-${store.platform}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                            <TableCell className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{store.store_name}</TableCell>
                            <TableCell>
                              <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/30 capitalize text-[10px] rounded-full px-2 py-0">{store.platform}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">{formatIDR(store.omzet)}</TableCell>
                            <TableCell className="text-xs text-right font-bold text-emerald-600">{formatIDR(store.net_profit)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getMarginStyle(store.margin_percentage)}`}>
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
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Top 10 Produk — Kontribusi Profit</p>
              <Card className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 p-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                    Diurutkan berdasarkan profit kotor terbesar (penjualan produk dikurangi HPP pokok).
                  </p>
                  <Table>
                    <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
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
                          <TableRow key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                            <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 max-w-[280px] truncate" title={item.product_name}>
                              {item.product_name}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 py-0.5 px-2 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">{item.product_sku || '-'}</span>
                            </TableCell>
                            <TableCell className="text-center text-xs font-semibold">{item.total_qty} pcs</TableCell>
                            <TableCell className="text-right text-xs font-medium">{formatIDR(item.gross_sales)}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-emerald-600">{formatIDR(item.gross_profit)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getMarginStyle(item.margin_percentage)}`}>
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

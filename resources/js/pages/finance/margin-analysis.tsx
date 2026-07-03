/* eslint-disable react-hooks/set-state-in-effect */
import { Head, router } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Calendar, Clock, DollarSign, Percent, ShoppingBag, TrendingUp, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import MarginAnalysisController from '@/actions/App/Http/Controllers/MarginAnalysisController';
import Heading from '@/components/heading';
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

export default function MarginAnalysis({ summary, trendData, storePerformance, productPerformance, storesList, filters }: Props) {
  // 1. Amankan inisialisasi state dengan memaksa store_id menjadi String
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [storeId, setStoreId] = useState(String(filters.store_id ?? 'all'));

  // 2. Paksa state lokal sinkron dan pastikan tipe datanya selalu String saat props berubah
  useEffect(() => {
    setStartDate(filters.start_date);
    setEndDate(filters.end_date);
    setStoreId(String(filters.store_id ?? 'all'));
  }, [filters.start_date, filters.end_date, filters.store_id]);

  // 3. Gunakan window.location.pathname dan tambahkan replace: true agar history browser tidak penuh
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      start_date: startDate,
      end_date: endDate,
      store_id: storeId
    }, {
      preserveState: true,
      replace: true // Mengganti URL saat ini tanpa menumpuk tombol 'Back' di browser
    });
  };

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      <Head title="Analisa Margin & Profit" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* HEADER & FILTER BAR */}
        <div className="flex flex-col gap-5 border-b pb-6">
          <div>
            <Heading
              title="Analisa Margin"
              description="Pantau profitabilitas riil toko dan produk Anda setelah dipotong beban HPP, admin marketplace, dan biaya affiliate."
            />
          </div>

          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col gap-3 w-full sm:flex-row justify-center sm:flex-wrap"
          >
            <div className="flex items-center gap-2 bg-card px-3 h-10 rounded-lg border shadow-sm w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none border-none focus:ring-0 w-[115px] cursor-pointer dark:color-scheme-dark"
              />
              <span className="text-muted-foreground text-xs font-medium px-1">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none border-none focus:ring-0 w-[115px] cursor-pointer dark:color-scheme-dark"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select value={storeId} onValueChange={(value) => setStoreId(value)}>
                <SelectTrigger className="w-full h-10 text-xs bg-card shadow-sm">
                  <SelectValue placeholder="Pilih Toko" />
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
            </div>

            <Button type="submit" size="sm" className="h-10 px-5 w-full sm:w-auto font-medium shadow-sm shrink-0">
              Terapkan
            </Button>
          </form>
        </div>

        {/* Hitung Total Seluruh Beban di atas return atau langsung sebelum layout kartu */}
        {(() => {
          const totalBeban = summary.total_hpp + summary.total_admin_fee + summary.total_affiliate_fee + summary.total_ads_fee;

          return (
            /* Menggunakan min-h-[210px] agar tinggi kartu seragam dan pas untuk menampung rincian biaya */
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

              {/* CARD 1: TOTAL OMZET */}
              <Card className="shadow-sm border-muted/60 flex flex-col min-h-[210px] justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Omzet</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                  {/* PEMBUNGKUS INI MEMBUAT ANGKA PAS DI TENGAH MATI */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      {formatIDR(summary.total_omzet)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground border-t pt-1.5 border-dashed mt-auto">
                    Akumulasi nilai transaksi bruto (Kotor)
                  </p>
                </CardContent>
              </Card>

              {/* CARD 2: GABUNGAN TOTAL BEBAN PENGELUARAN */}
              <Card className="shadow-sm border-muted/60 flex flex-col min-h-[210px] justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Beban & Biaya</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-destructive shrink-0" />
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                  {/* PEMBUNGKUS INI MEMBUAT ANGKA PAS DI TENGAH MATI */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-destructive">
                      {formatIDR(totalBeban)}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-dashed border-muted flex flex-col gap-0.5 text-[11px] mt-auto">
                    <div className="flex justify-between text-muted-foreground">
                      <span>• Pokok (HPP):</span>
                      <span className="font-medium text-foreground">{formatIDR(summary.total_hpp)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• Admin Marketplace:</span>
                      <span className="font-medium text-foreground">{formatIDR(summary.total_admin_fee)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• Biaya Iklan (Ads):</span>
                      <span className="text-purple-600 font-semibold">{formatIDR(summary.total_ads_fee)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>• Komisi Affiliate:</span>
                      <span className="text-indigo-600 font-semibold">{formatIDR(summary.total_affiliate_fee)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: PROFIT BERSIH RIIL */}
              <Card className="border-emerald-500/30 bg-emerald-500/[0.01] shadow-sm flex flex-col min-h-[210px] justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Profit Riil (Selesai)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                  {/* PEMBUNGKUS INI MEMBUAT ANGKA PAS DI TENGAH MATI */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-black text-emerald-600 tracking-tight">
                      {formatIDR(summary.net_profit)}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-dashed border-emerald-500/20 mt-auto">
                    <div className="flex flex-row justify-between items-center text-[10px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1 border-b border-b-amber-600/30 pb-1 border-dashed">
                        <strong className="text-amber-600 font-bold ml-0.5">{formatIDR(summary.profit_pending)}</strong>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </span>
                      <span className="flex items-center gap-1 border-b border-b-blue-600/30 pb-1 border-dashed">
                        <strong className="text-blue-600 font-bold ml-0.5">{formatIDR(summary.profit_processing)}</strong>
                        <Truck className="w-4 h-4 text-blue-600" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 4: RATA-RATA MARGIN */}
              <Card className="shadow-sm border-muted/60 flex flex-col min-h-[210px] justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rata-Rata Margin</CardTitle>
                  <Percent className="h-4 w-4 text-primary shrink-0" />
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                  {/* PEMBUNGKUS INI MEMBUAT ANGKA PAS DI TENGAH MATI */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-primary">
                      {summary.average_margin_percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t pt-1.5 border-dashed mt-auto">
                    <span className="text-[11px] text-muted-foreground">Status Margin:</span>
                    {summary.average_margin_percentage >= 20 ? (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
                        <ArrowUpRight className="h-3.5 w-3.5 inline mr-0.5 shrink-0" /> Sehat (&gt;20%)
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 font-semibold flex items-center">
                        <ArrowDownRight className="h-3.5 w-3.5 inline mr-0.5 shrink-0" /> Tipis (&lt;20%)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          );
        })()}

        {/* 2. AREA GRAFIK */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Tren Pertumbuhan Profit Harian</CardTitle>
              <CardDescription>Komparasi pergerakan omzet kotor vs laba bersih riil Anda.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pl-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                  <XAxis dataKey="date" className="text-[10px]" stroke="#888888" />
                  <YAxis className="text-[10px]" stroke="#888888" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value: any) => formatIDR(value)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#2563eb" fillOpacity={1} fill="url(#colorOmzet)" strokeWidth={2} />
                  <Area type="monotone" dataKey="net_profit" name="Profit Bersih" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Performa Profit Antar Toko</CardTitle>
              <CardDescription>Toko mana yang menghasilkan kontribusi uang tunai terbanyak.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storePerformance} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis type="number" className="text-[10px]" stroke="#888888" tickFormatter={(v) => `${v / 1000}k`} />
                  <YAxis dataKey="store_name" type="category" className="text-[11px] font-medium" stroke="#888888" width={90} />
                  <Tooltip formatter={(value: any) => formatIDR(value)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="omzet" name="Omzet" fill="#93c5fd" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="net_profit" name="Profit Bersih" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 3. TABEL RANKING PRODUK */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top 10 Produk Berdasarkan Kontribusi Profit</CardTitle>
            <CardDescription>Diurutkan berdasarkan total keuntungan kotor terbesar (Omzet Produk - HPP Pokok).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Nama Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">Terjual</TableHead>
                  <TableHead className="text-right">Total Penjualan</TableHead>
                  <TableHead className="text-right text-emerald-600 font-bold">Estimasi Profit</TableHead>
                  <TableHead className="text-center">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                      Tidak ada data transaksi produk pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  productPerformance.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-xs max-w-[400px] truncate">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.product_sku || '-'}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {item.total_qty} pcs
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatIDR(item.gross_sales)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-emerald-600">
                        {formatIDR(item.gross_profit)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${item.margin_percentage >= 25 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          item.margin_percentage >= 15 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
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
  );
}

MarginAnalysis.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Analisa Margin', href: MarginAnalysisController.index() },
  ],
};
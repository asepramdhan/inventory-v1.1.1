/* eslint-disable react-hooks/set-state-in-effect */
import { Head, router } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Building2, Calendar, DollarSign, Percent, ShoppingBag, TrendingUp } from 'lucide-react';
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
  // State untuk manajemen filter local sebelum di-submit
  const [startDate, setStartDate] = useState(filters.start_date);
  const [endDate, setEndDate] = useState(filters.end_date);
  const [storeId, setStoreId] = useState(filters.store_id);

  // 2. PENTING: Paksa state lokal sinkron setiap kali Laravel mengirimkan props filter baru
  useEffect(() => {
    setStartDate(filters.start_date);
    setEndDate(filters.end_date);
    setStoreId(filters.store_id);
  }, [filters.start_date, filters.end_date, filters.store_id]);

  // Fungsi untuk memicu reload data berdasarkan filter ke Laravel
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/finance/margin-analysis', {
      start_date: startDate,
      end_date: endDate,
      store_id: storeId
    }, { preserveState: true });
  };

  // Helper untuk format Rupiah yang rapi
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
        {/* HEADER & FILTER BAR (STACKED & RIGHT-ALIGNED) */}
        <div className="flex flex-col gap-5 border-b pb-6">
          {/* Baris 1: Judul & Deskripsi Halaman */}
          <div>
            <Heading
              title="Analisa Margin"
              description="Pantau profitabilitas riil toko dan produk Anda setelah dipotong beban HPP & admin marketplace."
            />
          </div>

          {/* Baris 2: Toolbar Filter (Di bawah header, rata kanan di desktop) */}
          <form
            onSubmit={handleFilterSubmit}
            className="flex flex-col gap-3 w-full sm:flex-row justify-center sm:flex-wrap"
          >
            {/* Kapsul Filter Tanggal */}
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

            {/* Dropdown Pilih Toko */}
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

            {/* Tombol Terapkan */}
            <Button type="submit" size="sm" className="h-10 px-5 w-full sm:w-auto font-medium shadow-sm shrink-0">
              Terapkan
            </Button>
          </form>
        </div>

        {/* 1. KARTU RINGKASAN UTAMA (SUMMARY CARDS) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Card Total Omzet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Omzet</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatIDR(summary.total_omzet)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Bruto (Pendapatan Kotor)</p>
            </CardContent>
          </Card>

          {/* Card Total HPP */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Beban Pokok (HPP)</CardTitle>
              <ShoppingBag className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">{formatIDR(summary.total_hpp)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Modal Produk Terkunci</p>
            </CardContent>
          </Card>

          {/* Card Potongan Admin */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Potongan Admin</CardTitle>
              <Building2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-500">{formatIDR(summary.total_admin_fee)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Biaya Sistem & Platform</p>
            </CardContent>
          </Card>

          {/* Card Profit Bersih */}
          <Card className="border-emerald-500/30 bg-emerald-500/[0.02] lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-bold text-emerald-600">Profit Riil (Selesai)</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {/* Angka Utama Naik ke Atas agar sejajar dengan Card Lain */}
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatIDR(summary.net_profit)}
              </div>

              {/* Kunci Perapian: Gabungkan subteks dan badge dalam satu baris horizontal */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-dashed border-emerald-500/10">
                {/* <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  Uang Riil (Selesai)
                </p> */}

                <div className="flex gap-1 text-[8px] font-bold tracking-tight">
                  <span className="bg-amber-500/10 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1 py-0.5 rounded">
                    PND: {formatIDR(summary.profit_pending)}
                  </span>
                  <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1 py-0.5 rounded">
                    PRS: {formatIDR(summary.profit_processing)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Persentase Margin */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Rata-rata Margin</CardTitle>
              <Percent className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.average_margin_percentage}%</div>
              <div className="flex items-center gap-1 mt-1">
                {summary.average_margin_percentage >= 20 ? (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center"><ArrowUpRight className="h-3 w-3 inline" /> Sehat (&gt;20%)</span>
                ) : (
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center"><ArrowDownRight className="h-3 w-3 inline" /> Tipis (&lt;20%)</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. AREA GRAFIK (CHARTS SECTION) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Grafik Tren Omzet vs Net Profit */}
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

          {/* Grafik Kontribusi Toko */}
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

        {/* 3. TABEL RANKING PRODUK (PRODUCT PROFITABILITY RANKING) */}
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
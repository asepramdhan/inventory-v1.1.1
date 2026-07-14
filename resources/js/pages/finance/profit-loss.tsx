import { Head, router } from '@inertiajs/react';
import { Calendar, DollarSign, Download, FileSpreadsheet, Printer, TrendingUp, TrendingDown, ArrowRight, Calculator } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IncomeItem {
  category: string;
  total: number;
}

interface ExpenseItem {
  category: string;
  total: number;
}

interface PLData {
  gross_sales: number;
  total_discount: number;
  net_sales: number;
  other_incomes: IncomeItem[];
  total_other_income: number;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_ads: number;
  total_affiliate: number;
  total_admin_fee: number;
  total_supplies: number;
  other_expenses: ExpenseItem[];
  total_other_expense: number;
  total_expenses: number;
  net_profit: number;
}

interface Filters {
  month: number;
  year: number;
  available_years: number[];
}

interface Props {
  data: PLData;
  filters: Filters;
}

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

export default function ProfitLoss({ data, filters }: Props) {
  const [month, setMonth] = useState<string>(filters.month.toString());
  const [year, setYear] = useState<string>(filters.year.toString());

  const handleFilterChange = (newMonth: string, newYear: string) => {
    setMonth(newMonth);
    setYear(newYear);
    router.get(
      '/finance/profit-loss',
      { month: newMonth, year: newYear },
      { preserveState: true }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (amount: number) => {
    if (data.net_sales <= 0) return '0%';
    const pct = (amount / data.net_sales) * 100;
    return pct.toFixed(1) + '%';
  };

  const handleExportExcel = () => {
    window.location.href = `/finance/profit-loss/export?month=${month}&year=${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (m: number) => {
    return MONTHS.find(item => item.value === m)?.label || '';
  };

  return (
    <>
      <Head title="Laporan Laba Rugi" />

      {/* Styled inline media rule to strip sidebar & filters cleanly in printed PDFs */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide sidebar, headers, filters, toast and notifications */
          header, nav, aside, button, .no-print, [data-slot="sidebar"], [data-slot="header"] {
            display: none !important;
          }
          /* Expand content fully */
          main, .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-card {
            border: 1px solid #e4e4e7 !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}} />

      <div className="flex h-full flex-1 flex-col gap-4 p-4 print-container">
        {/* Page Header (Hidden in Print) */}
        <div className="flex items-center justify-between no-print border-b border-sidebar-border/60 pb-4">
          <Heading
            title="Laporan Laba Rugi Bulanan"
            description="Analisa pendapatan, HPP, beban usaha, dan hasil laba bersih bulanan Anda."
          />
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Bulan */}
            <Select value={month} onValueChange={(val) => handleFilterChange(val, year)}>
              <SelectTrigger className="w-[140px] rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-10">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((item) => (
                  <SelectItem key={item.value} value={item.value.toString()}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Tahun */}
            <Select value={year} onValueChange={(val) => handleFilterChange(month, val)}>
              <SelectTrigger className="w-[110px] rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-10">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {filters.available_years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="rounded-xl border-emerald-600/20 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/30 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs h-10 px-4 gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Ekspor Excel
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="rounded-xl border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-medium text-xs h-10 px-4 gap-2 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-zinc-500" />
              Cetak Laporan
            </Button>
          </div>
        </div>

        {/* Top KPI Cards Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pendapatan Bersih */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm print-card bg-white dark:bg-zinc-900/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-500" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Pendapatan Bersih</span>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{formatCurrency(data.total_revenue)}</h3>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Total HPP */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm print-card bg-white dark:bg-zinc-900/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Beban Pokok (HPP)</span>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{formatCurrency(data.total_cogs)}</h3>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Calculator className="h-4.5 w-4.5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Total Beban Usaha */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm print-card bg-white dark:bg-zinc-900/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Beban Operasional</span>
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{formatCurrency(data.total_expenses)}</h3>
              </div>
              <div className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl">
                <TrendingDown className="h-4.5 w-4.5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Laba Bersih */}
          <Card className={`relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm print-card ${
            data.net_profit >= 0 ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : 'bg-red-50/20 dark:bg-red-950/10'
          }`}>
            <div className={`absolute inset-x-0 top-0 h-1 ${data.net_profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Laba Bersih Akhir</span>
                <h3 className={`text-lg font-bold ${data.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(data.net_profit)}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${
                data.net_profit >= 0 
                  ? 'bg-emerald-55 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-55 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                {data.net_profit >= 0 ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Sheet Body */}
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-card print-card">
          {/* Print Only Header Info */}
          <div className="hidden print:block p-6 border-b border-zinc-100 text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">LAPORAN LABA RUGI BULANAN</h1>
            <p className="text-sm font-semibold text-zinc-600">Periode: {getMonthName(filters.month)} {filters.year}</p>
            <p className="text-[10px] text-zinc-400 italic">Dicetak secara otomatis dari sistem manajemen inventori</p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <table className="w-full text-sm leading-relaxed border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 text-left font-semibold">Keterangan Akun Finansial</th>
                  <th className="py-3 text-right font-semibold w-[180px]">Nominal (Rupiah)</th>
                  <th className="py-3 text-right font-semibold w-[120px] no-print">% Omzet</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. SEKSI PENDAPATAN */}
                <tr className="font-bold text-zinc-800 dark:text-zinc-200 text-xs tracking-wide">
                  <td className="pt-6 pb-2 text-left uppercase" colSpan={3}>I. PENDAPATAN USAHA (REVENUE)</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs">Pendapatan Penjualan Toko (Gross)</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(data.gross_sales)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(data.gross_sales)}</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs text-red-500 dark:text-red-400">Potongan Harga / Diskon Penjualan (-)</td>
                  <td className="py-2.5 text-right font-mono text-xs text-red-500 dark:text-red-400">-({formatCurrency(data.total_discount)})</td>
                  <td className="py-2.5 text-right font-mono text-xs text-red-500/85 no-print">-{formatPercent(data.total_discount)}</td>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/10 font-bold border-b border-zinc-200/50 dark:border-zinc-800">
                  <td className="py-3 pl-4 text-zinc-850 dark:text-zinc-200 text-xs">Total Pendapatan Bersih Penjualan</td>
                  <td className="py-3 text-right font-mono text-xs underline decoration-solid">{formatCurrency(data.net_sales)}</td>
                  <td className="py-3 text-right font-mono text-xs text-zinc-500 no-print">100.0%</td>
                </tr>

                {/* Pendapatan Lain-lain */}
                {data.other_incomes.length > 0 && (
                  <>
                    <tr className="font-semibold text-zinc-850 dark:text-zinc-200 text-xs">
                      <td className="pt-4 pb-1 pl-4 text-left" colSpan={3}>Pendapatan Non-Operasional Lainnya:</td>
                    </tr>
                    {data.other_incomes.map((inc) => (
                      <tr key={inc.category} className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pl-8 text-zinc-650 dark:text-zinc-400 text-xs">{inc.category}</td>
                        <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(inc.total)}</td>
                        <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(inc.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/10 font-bold border-b border-zinc-200/50 dark:border-zinc-800">
                      <td className="py-3 pl-4 text-zinc-850 dark:text-zinc-200 text-xs">Total Pemasukan Lain-lain</td>
                      <td className="py-3 text-right font-mono text-xs">{formatCurrency(data.total_other_income)}</td>
                      <td className="py-3 text-right font-mono text-xs text-zinc-500 no-print">{formatPercent(data.total_other_income)}</td>
                    </tr>
                  </>
                )}

                {/* Total Revenue Aggregated */}
                <tr className="bg-blue-50/20 dark:bg-blue-950/15 font-bold border-b-2 border-zinc-300 dark:border-zinc-700">
                  <td className="py-3.5 text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wide">TOTAL PENDAPATAN KESELURUHAN (A)</td>
                  <td className="py-3.5 text-right font-mono text-xs text-blue-600 dark:text-blue-400 underline decoration-double">{formatCurrency(data.total_revenue)}</td>
                  <td className="py-3.5 text-right font-mono text-xs text-blue-600 dark:text-blue-400 no-print">{formatPercent(data.total_revenue)}</td>
                </tr>

                {/* 2. SEKSI HARGA POKOK PENJUALAN */}
                <tr className="font-bold text-zinc-850 dark:text-zinc-200 text-xs tracking-wide">
                  <td className="pt-6 pb-2 text-left uppercase" colSpan={3}>II. HARGA POKOK PENJUALAN (COGS)</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs">Biaya Pokok / HPP Barang Terjual (-)</td>
                  <td className="py-2.5 text-right font-mono text-xs text-red-500 dark:text-red-400">-({formatCurrency(data.total_cogs)})</td>
                  <td className="py-2.5 text-right font-mono text-xs text-red-500/80 no-print">-{formatPercent(data.total_cogs)}</td>
                </tr>
                <tr className="bg-amber-50/20 dark:bg-amber-950/10 font-bold border-b border-zinc-250 dark:border-zinc-800">
                  <td className="py-3 text-zinc-850 dark:text-zinc-200 text-xs uppercase">LABA KOTOR USAHA (D = Penjualan Bersih - HPP)</td>
                  <td className="py-3 text-right font-mono text-xs underline decoration-solid">{formatCurrency(data.gross_profit)}</td>
                  <td className="py-3 text-right font-mono text-xs text-zinc-500 no-print">{formatPercent(data.gross_profit)}</td>
                </tr>

                {/* 3. SEKSI BEBAN USAHA */}
                <tr className="font-bold text-zinc-850 dark:text-zinc-200 text-xs tracking-wide">
                  <td className="pt-6 pb-2 text-left uppercase" colSpan={3}>III. BEBAN OPERASIONAL & PENJUALAN (EXPENSES)</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs">Beban Iklan Toko (Ads Spend)</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(data.total_ads)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(data.total_ads)}</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs">Beban Affiliate Fee (E-Commerce)</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(data.total_affiliate)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(data.total_affiliate)}</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs">Biaya Administrasi Marketplace (E-Commerce)</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(data.total_admin_fee)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(data.total_admin_fee)}</td>
                </tr>
                <tr className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pl-4 text-zinc-650 dark:text-zinc-400 text-xs">Beban Pemakaian Bahan Operasional (Packing/Plastik)</td>
                  <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(data.total_supplies)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(data.total_supplies)}</td>
                </tr>

                {/* Beban Pengeluaran Lainnya (Dari Kas) */}
                {data.other_expenses.length > 0 && (
                  <>
                    <tr className="font-semibold text-zinc-850 dark:text-zinc-200 text-xs">
                      <td className="pt-4 pb-1 pl-4 text-left" colSpan={3}>Beban Pengeluaran Kas Operasional:</td>
                    </tr>
                    {data.other_expenses.map((exp) => (
                      <tr key={exp.category} className="border-b border-zinc-250/40 dark:border-zinc-800/50 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pl-8 text-zinc-650 dark:text-zinc-400 text-xs">{exp.category}</td>
                        <td className="py-2.5 text-right font-mono text-xs">{formatCurrency(exp.total)}</td>
                        <td className="py-2.5 text-right font-mono text-xs text-zinc-400 no-print">{formatPercent(exp.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/10 font-bold border-b border-zinc-200/50 dark:border-zinc-800">
                      <td className="py-3 pl-4 text-zinc-850 dark:text-zinc-200 text-xs">Total Pengeluaran Kas Lainnya</td>
                      <td className="py-3 text-right font-mono text-xs">{formatCurrency(data.total_other_expense)}</td>
                      <td className="py-3 text-right font-mono text-xs text-zinc-500 no-print">{formatPercent(data.total_other_expense)}</td>
                    </tr>
                  </>
                )}

                {/* Total Expenses Summary */}
                <tr className="bg-red-50/20 dark:bg-red-950/10 font-bold border-b-2 border-zinc-300 dark:border-zinc-700">
                  <td className="py-3.5 text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wide">TOTAL BEBAN USAHA OPERASIONAL (E)</td>
                  <td className="py-3.5 text-right font-mono text-xs text-red-600 dark:text-red-400 underline decoration-double">-({formatCurrency(data.total_expenses)})</td>
                  <td className="py-3.5 text-right font-mono text-xs text-red-600 dark:text-red-400 no-print">-{formatPercent(data.total_expenses)}</td>
                </tr>

                {/* 4. NET PROFIT */}
                <tr className={`font-bold border-b-2 border-zinc-400 ${
                  data.net_profit >= 0 ? 'bg-emerald-50/40 dark:bg-emerald-950/15' : 'bg-red-50/40 dark:bg-red-950/15'
                }`}>
                  <td className="py-4 text-zinc-950 dark:text-zinc-50 text-xs uppercase tracking-wider font-extrabold">IV. LABA / RUGI BERSIH AKHIR (A - HPP - E)</td>
                  <td className={`py-4 text-right font-mono text-sm font-extrabold ${
                    data.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`} style={{ borderBottom: '3px double currentColor' }}>
                    {formatCurrency(data.net_profit)}
                  </td>
                  <td className={`py-4 text-right font-mono text-xs font-extrabold no-print ${
                    data.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatPercent(data.net_profit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

ProfitLoss.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Laporan Laba Rugi', href: '/finance/profit-loss' },
  ],
};

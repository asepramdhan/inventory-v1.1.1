/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link, router } from '@inertiajs/react';
import { Box, DollarSign, FileSpreadsheet, Megaphone, MoreHorizontalIcon, PencilIcon, Percent, Plus, Search, Trash2, Trash2Icon, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdsAffiliateController from '@/actions/App/Http/Controllers/AdsAffiliateController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StorePerformance {
  store_name: string;
  platform: string;
  omzet: number;
  ads_spent: number;
  affiliate_fee: number;
  total_marketing: number;
  ratio: number;
}

interface AdsExpenseItem {
  id: number;
  store_id: number;
  date: string;
  created_at: string;
  amount_spent: number;
  affiliate_fee: number;
  description: string | null;
  store?: { name: string; platform: string };
}

function AdsExpensesTableSkeleton() {
  return (
    <Card className="shadow-sm overflow-hidden animate-pulse">
      <CardContent className="p-3">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead><div className="h-4 w-4 bg-muted rounded" /></TableHead>
              <TableHead className="w-[130px]">Tanggal</TableHead>
              <TableHead>Nama Toko</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="text-right">Biaya Iklan</TableHead>
              <TableHead className="text-right">Affiliate</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right w-[80px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4].map((i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-4 bg-muted rounded" /></TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="h-3.5 bg-muted rounded w-20" />
                    <div className="h-3 bg-muted/60 rounded w-24" />
                  </div>
                </TableCell>
                <TableCell><div className="h-3.5 bg-muted rounded w-28" /></TableCell>
                <TableCell><div className="h-5 bg-muted rounded w-16" /></TableCell>
                <TableCell className="text-right"><div className="h-3.5 bg-muted rounded w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><div className="h-3.5 bg-muted rounded w-16 ml-auto" /></TableCell>
                <TableCell className="text-right"><div className="h-3.5 bg-muted rounded w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><div className="h-8 w-8 bg-muted rounded ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdsAffiliate({ adsExpenses, storesList, filters, summary, storePerformance }: {
  adsExpenses: { data: AdsExpenseItem[]; from: number; to: number; total: number; last_page: number; current_page: number; prev_page_url: string | null; next_page_url: string | null };
  storesList: { id: number; name: string; platform: string }[];
  filters: { search: string; store_id: string; start_date: string; end_date: string };
  summary: {
    total_omzet: number;
    total_ads: number;
    total_affiliate: number;
    total_affiliate_transactions: number;
    total_marketing_cost: number;
    marketing_ratio_percentage: number;
  };
  storePerformance: StorePerformance[];
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);
  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<AdsExpenseItem | null>(null);
  const [storeId, setStoreId] = useState<string>('');
  const [editDate, setEditDate] = useState('');

  const [storeFilter, setStoreFilter] = useState(filters?.store_id || 'all');
  const [startDate, setStartDate] = useState(filters?.start_date || '');
  const [endDate, setEndDate] = useState(filters?.end_date || '');

  const [rawAmount, setRawAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [rawAffiliate, setRawAffiliate] = useState('');
  const [displayAffiliate, setDisplayAffiliate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSelectedIds([]);

    if (selectedExpense) {
      setStoreId(selectedExpense.store_id?.toString() || '');
      setRawAmount(selectedExpense.amount_spent?.toString() || '');
      setDisplayAmount(new Intl.NumberFormat('id-ID').format(selectedExpense.amount_spent || 0));
      setRawAffiliate(selectedExpense.affiliate_fee?.toString() || '');
      setDisplayAffiliate(new Intl.NumberFormat('id-ID').format(selectedExpense.affiliate_fee || 0));
      setEditDate(selectedExpense.date?.includes('T') ? selectedExpense.date.split('T')[0] : selectedExpense.date || '');
    } else {
      setStoreId('');
      setEditDate('');
    }
  }, [adsExpenses, selectedExpense]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get(
        AdsAffiliateController.index(),
        { search, store_id: storeFilter, start_date: startDate, end_date: endDate },
        { preserveState: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, storeFilter, startDate, endDate]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace('.', ':');
    return { dateStr, timeStr };
  };

  const getRatioStyle = (ratio: number) => {
    if (ratio > 15) return { badge: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Boros' };
    if (ratio > 10) return { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Waspada' };
    return { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Sehat' };
  };

  const hasActiveFilters = search !== '' || storeFilter !== 'all';

  const handleResetFilters = () => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setSearch('');
    setStoreFilter('all');
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(adsExpenses.data.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (expenseId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, expenseId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== expenseId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    router.post('/finance/ads-affiliate/bulk-delete', { ids: selectedIds }, {
      onSuccess: () => setSelectedIds([]),
      preserveScroll: true,
    });
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    window.location.href = `/finance/ads-affiliate/export?ids=${selectedIds.join(',')}`;
  };

  const resetForm = () => {
    setRawAmount('');
    setDisplayAmount('');
    setRawAffiliate('');
    setDisplayAffiliate('');
    setSelectedExpense(null);
    setStoreId('');
    setEditDate('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setRawAmount(numericValue);
    setDisplayAmount(numericValue ? new Intl.NumberFormat('id-ID').format(Number(numericValue)) : '');
  };

  const handleAffiliateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setRawAffiliate(numericValue);
    setDisplayAffiliate(numericValue ? new Intl.NumberFormat('id-ID').format(Number(numericValue)) : '');
  };

  const ratioStyle = getRatioStyle(summary?.marketing_ratio_percentage || 0);

  return (
    <>
      <Head title="Iklan & Affiliate" />
      <div className="flex flex-col gap-4 p-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Heading
            title="Iklan & Affiliate"
            description="Pantau efisiensi marketing ads dan penyerapan komisi affiliate toko Anda."
          />
          <Sheet
            open={isSheetOpen}
            onOpenChange={(open) => {
              setIsSheetOpen(open);
              if (!open) resetForm();
            }}
          >
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 self-start sm:self-auto shadow-sm">
                <Plus className="h-4 w-4" />
                Tambah Pengeluaran
              </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
              <SheetHeader className="p-6 pb-0">
                <SheetTitle>Tambah Biaya Marketing</SheetTitle>
                <SheetDescription>
                  Masukkan data pengeluaran iklan harian ke dalam sistem untuk kalkulasi profit otomatis.
                </SheetDescription>
              </SheetHeader>

              <Form
                key={`add-expense-form-${formKey}`}
                {...AdsAffiliateController.store.form()}
                options={{ preserveScroll: true }}
                onSuccess={() => {
                  if (submitAction === 'save') {
                    setIsSheetOpen(false);
                    resetForm();
                  } else {
                    resetForm();
                    setFormKey((prev) => prev + 1);
                  }
                }}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {({ processing, errors }) => (
                  <>
                    <div className="grid flex-1 auto-rows-min gap-6 px-6 py-4 overflow-y-auto no-scrollbar">
                      <div className="grid gap-3">
                        <Label htmlFor="store_id">Pilih Toko</Label>
                        <Select value={storeId} onValueChange={setStoreId}>
                          <SelectTrigger id="store_id" className="w-full bg-background h-9 text-xs">
                            <SelectValue placeholder="-- Pilih Toko --" />
                          </SelectTrigger>
                          <SelectContent>
                            {storesList?.length > 0 ? (
                              storesList.map((store) => (
                                <SelectItem key={store.id} value={store.id.toString()}>
                                  {store.name} ({store.platform})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground p-2 text-center italic">
                                Belum ada toko yang terdaftar
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <input type="hidden" name="store_id" value={storeId} />
                        <InputError message={errors.store_id} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="date">Tanggal Pengeluaran</Label>
                        <Input
                          id="date"
                          type="date"
                          name="date"
                          required
                          className="h-9 text-xs"
                          defaultValue={(() => {
                            const d = new Date();
                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          })()}
                        />
                        <InputError message={errors.date} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="amount_spent">Biaya Iklan / Ads (Rp)</Label>
                        <input type="hidden" name="amount_spent" value={rawAmount} required />
                        <Input id="amount_spent" type="text" className="h-9 text-xs" value={displayAmount} onChange={handleAmountChange} placeholder="150.000" />
                        <InputError message={errors.amount_spent} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="affiliate_fee">
                          Komisi Affiliate (Rp) <span className="text-muted-foreground text-[10px]">(Opsional)</span>
                        </Label>
                        <input type="hidden" name="affiliate_fee" value={rawAffiliate} />
                        <Input id="affiliate_fee" type="text" className="h-9 text-xs" value={displayAffiliate} onChange={handleAffiliateChange} placeholder="50.000" />
                        <InputError message={errors.affiliate_fee} />
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="description">Catatan Tambahan</Label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          placeholder="Contoh: Naikkan budget iklan karena campaign tanggal kembar..."
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <InputError message={errors.description} />
                      </div>
                    </div>

                    <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                      <Button type="submit" variant="secondary" disabled={processing} className="text-xs" onClick={() => setSubmitAction('save')}>
                        {processing && submitAction === 'save' ? 'Menyimpan...' : 'Simpan Data'}
                      </Button>
                      <Button type="submit" disabled={processing} className="text-xs" onClick={() => setSubmitAction('save_and_add')}>
                        {processing && submitAction === 'save_and_add' ? 'Menyimpan...' : 'Simpan & Tambah Lagi'}
                      </Button>
                      <SheetClose asChild>
                        <Button variant="outline" type="button" className="text-xs" disabled={processing}>Batal</Button>
                      </SheetClose>
                    </SheetFooter>
                  </>
                )}
              </Form>
            </SheetContent>
          </Sheet>
        </div>

        {/* WIDGET RINGKASAN — 3 KARTU */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total Biaya Iklan</p>
                <h3 className="text-xl font-black text-blue-600 tracking-tight">
                  {isLoading ? <Skeleton className="h-7 w-[150px]" /> : formatIDR(summary?.total_ads || 0)}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Affiliate manual {formatIDR(summary?.total_affiliate || 0)} · Order {formatIDR(summary?.total_affiliate_transactions || 0)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Megaphone className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total Beban Marketing</p>
                <h3 className="text-xl font-black text-purple-600 tracking-tight">
                  {isLoading ? <Skeleton className="h-7 w-[150px]" /> : formatIDR(summary?.total_marketing_cost || 0)}
                </h3>
                <p className="text-[10px] text-muted-foreground">Iklan + affiliate manual + affiliate order</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Rasio Beban / Omzet</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-amber-600 tracking-tight">
                    {isLoading ? <Skeleton className="h-7 w-[53px]" /> : `${summary?.marketing_ratio_percentage || 0}%`}
                  </h3>
                  {!isLoading && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${ratioStyle.badge}`}>
                      {ratioStyle.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Omzet {formatIDR(summary?.total_omzet || 0)} · ideal &lt; 15%
                </p>
              </div>
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Percent className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col lg:flex-row items-center gap-2 w-full bg-card p-3 rounded-lg border shadow-sm">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Input type="date" className="w-full sm:w-[150px] h-9 text-xs" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-xs text-muted-foreground">s/d</span>
            <Input type="date" className="w-full sm:w-[150px] h-9 text-xs" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                <SelectValue placeholder="Semua Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {storesList?.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-xs h-9" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            )}
          </div>
          <div className="relative w-full max-w-sm lg:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari toko, catatan, nominal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* TABEL PERFORMA PER TOKO */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Performa Marketing per Toko</p>
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-3">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">Nama Toko</TableHead>
                    <TableHead className="text-xs">Platform</TableHead>
                    <TableHead className="text-xs text-right">Omzet</TableHead>
                    <TableHead className="text-xs text-right">Iklan</TableHead>
                    <TableHead className="text-xs text-right">Aff. Manual</TableHead>
                    <TableHead className="text-xs text-right">Total Marketing</TableHead>
                    <TableHead className="text-xs text-center w-[100px]">Rasio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!storePerformance?.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-xs">
                        Belum ada data performa toko pada rentang tanggal ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    storePerformance.map((store) => {
                      const storeRatio = getRatioStyle(store.ratio);
                      return (
                        <TableRow key={`${store.store_name}-${store.platform}`} className="hover:bg-muted/10">
                          <TableCell className="text-xs font-bold">{store.store_name}</TableCell>
                          <TableCell>
                            <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 capitalize text-[10px]">
                              {store.platform}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">{formatIDR(store.omzet)}</TableCell>
                          <TableCell className="text-xs text-right text-blue-600 font-semibold">{formatIDR(store.ads_spent)}</TableCell>
                          <TableCell className="text-xs text-right text-purple-600 font-medium">{formatIDR(store.affiliate_fee)}</TableCell>
                          <TableCell className="text-xs text-right font-extrabold">{formatIDR(store.total_marketing)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${storeRatio.badge}`}>
                              {store.ratio}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* LOG HARIAN */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground">Log Pengeluaran Harian</p>
          {isLoading ? (
            <AdsExpensesTableSkeleton />
          ) : (
            <Card className="shadow-sm overflow-hidden">
              <CardContent className="p-3">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={adsExpenses.data.length > 0 && selectedIds.length === adsExpenses.data.length}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-[130px] text-xs">Tanggal</TableHead>
                      <TableHead className="text-xs">Nama Toko</TableHead>
                      <TableHead className="text-xs">Platform</TableHead>
                      <TableHead className="text-xs text-right">Biaya Iklan</TableHead>
                      <TableHead className="text-xs text-right">Affiliate</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs text-right w-[80px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adsExpenses.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon"><Box /></EmptyMedia>
                              <EmptyTitle>Belum ada data</EmptyTitle>
                              <EmptyDescription>Tidak ada rekaman biaya marketing pada filter ini.</EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      adsExpenses.data.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        const rowTotal = (item.amount_spent || 0) + (item.affiliate_fee || 0);

                        return (
                          <TableRow
                            key={item.id}
                            className={`cursor-pointer transition-colors hover:bg-muted/10 ${isSelected ? 'bg-muted/30' : ''}`}
                            onClick={() => {
                              setSelectedExpense(item);
                              setIsSheetOpenDetail(true);
                            }}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelectRow(item.id, !!checked)}
                                aria-label={`Select item-${item.id}`}
                              />
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium text-foreground">{formatDateTime(item.date).dateStr}</span>
                                <span className="text-[11px] text-muted-foreground italic">
                                  Pukul {formatDateTime(item.created_at).timeStr} WIB
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-bold">{item.store?.name || 'Toko Terhapus'}</TableCell>
                            <TableCell>
                              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 capitalize text-[10px]">
                                {item.store?.platform || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold text-blue-600">{formatIDR(item.amount_spent)}</TableCell>
                            <TableCell className="text-right text-xs font-medium text-purple-600">{formatIDR(item.affiliate_fee || 0)}</TableCell>
                            <TableCell className="text-right text-xs font-extrabold">{formatIDR(rowTotal)}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <AlertDialog>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8">
                                      <MoreHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedExpense(item);
                                        setIsSheetOpenEdit(true);
                                      }}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem variant="destructive">
                                        <Trash2Icon className="h-4 w-4" />
                                        Hapus
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus log ini?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Data pengeluaran marketing akan dihapus permanen dan tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <Link href={AdsAffiliateController.destroy(item.id)}>
                                      <AlertDialogAction variant="destructive">Hapus</AlertDialogAction>
                                    </Link>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {adsExpenses.last_page > 1 && (
                  <div className="flex items-center justify-between px-2 py-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Menampilkan {adsExpenses.from ?? 0}–{adsExpenses.to ?? 0} dari {adsExpenses.total ?? 0} log
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs h-8" disabled={!adsExpenses.prev_page_url} onClick={() => adsExpenses.prev_page_url && router.get(adsExpenses.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}>
                        Sebelumnya
                      </Button>
                      <span className="text-xs font-medium px-1">Hal {adsExpenses.current_page}/{adsExpenses.last_page}</span>
                      <Button variant="outline" size="sm" className="text-xs h-8" disabled={!adsExpenses.next_page_url} onClick={() => adsExpenses.next_page_url && router.get(adsExpenses.next_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}>
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border bg-background/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            <strong className="text-foreground font-semibold">{selectedIds.length}</strong> log terpilih
          </span>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="rounded-full text-xs h-8">Batal</Button>
            <Button variant="outline" size="sm" onClick={handleBulkExport} className="rounded-full gap-1.5 text-xs h-8 border-emerald-600/30 text-emerald-600">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-full gap-1.5 text-xs h-8">
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Terpilih
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus {selectedIds.length} log sekaligus?</AlertDialogTitle>
                  <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleBulkDelete}>Hapus Sekaligus</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <Sheet open={isSheetOpenDetail} onOpenChange={(open) => { setIsSheetOpenDetail(open); if (!open) resetForm(); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Rincian Log Marketing</SheetTitle>
            <SheetDescription>Rincian lengkap pengeluaran dana iklan harian.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {selectedExpense && (
              <>
                <div className="flex flex-col gap-1 border-b pb-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tanggal</span>
                  <span className="text-sm font-medium">{formatDateTime(selectedExpense.date).dateStr}</span>
                  <span className="text-[11px] text-muted-foreground italic">Pukul {formatDateTime(selectedExpense.created_at).timeStr} WIB</span>
                </div>
                <div className="flex flex-col gap-1 border-b pb-3">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Toko</span>
                  <span className="text-base font-semibold">{selectedExpense.store?.name}</span>
                  <Badge className="bg-sky-50 text-sky-700 capitalize w-fit text-[10px] mt-1">{selectedExpense.store?.platform}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 border-b pb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Iklan</p>
                    <p className="text-sm font-extrabold text-blue-600">{formatIDR(selectedExpense.amount_spent)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Affiliate</p>
                    <p className="text-sm font-extrabold text-purple-600">{formatIDR(selectedExpense.affiliate_fee || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
                    <p className="text-sm font-extrabold">{formatIDR(selectedExpense.amount_spent + (selectedExpense.affiliate_fee || 0))}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Catatan</span>
                  <p className="text-sm whitespace-pre-line">{selectedExpense.description || <span className="text-muted-foreground italic text-xs">Tidak ada catatan.</span>}</p>
                </div>
              </>
            )}
          </div>
          <SheetFooter className="p-6 border-t">
            <SheetClose asChild><Button variant="outline" className="text-xs">Tutup</Button></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isSheetOpenEdit} onOpenChange={(open) => { setIsSheetOpenEdit(open); if (!open) resetForm(); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Edit Pengeluaran Marketing</SheetTitle>
            <SheetDescription>Sesuaikan kembali nominal pengeluaran iklan toko Anda.</SheetDescription>
          </SheetHeader>

          <Form
            key={selectedExpense?.id}
            {...AdsAffiliateController.update.form(selectedExpense?.id ?? 0)}
            options={{ preserveScroll: true }}
            onSuccess={() => { setIsSheetOpenEdit(false); resetForm(); }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {({ processing, errors }) => (
              <>
                <div className="grid flex-1 auto-rows-min gap-6 px-6 py-4 overflow-y-auto no-scrollbar">
                  <div className="grid gap-3">
                    <Label htmlFor="store_id_edit">Nama Toko</Label>
                    <Select value={storeId} onValueChange={setStoreId}>
                      <SelectTrigger id="store_id_edit" className="w-full h-9 text-xs">
                        <SelectValue placeholder="-- Pilih Toko --" />
                      </SelectTrigger>
                      <SelectContent>
                        {storesList?.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="store_id" value={storeId} />
                    <InputError message={errors.store_id} />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="date_edit">Tanggal Pengeluaran</Label>
                    <Input id="date_edit" type="date" name="date" className="h-9 text-xs" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    <InputError message={errors.date} />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="amount_spent_edit">Biaya Iklan / Ads (Rp)</Label>
                    <input type="hidden" name="amount_spent" value={rawAmount} required />
                    <Input id="amount_spent_edit" type="text" className="h-9 text-xs" value={displayAmount} onChange={handleAmountChange} />
                    <InputError message={errors.amount_spent} />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="affiliate_fee_edit">Komisi Affiliate (Rp)</Label>
                    <input type="hidden" name="affiliate_fee" value={rawAffiliate} />
                    <Input id="affiliate_fee_edit" type="text" className="h-9 text-xs" value={displayAffiliate} onChange={handleAffiliateChange} />
                    <InputError message={errors.affiliate_fee} />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="description_edit">Catatan Tambahan</Label>
                    <textarea
                      id="description_edit"
                      name="description"
                      rows={3}
                      defaultValue={selectedExpense?.description || ''}
                      placeholder="Catatan campaign atau pengeluaran..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <InputError message={errors.description} />
                  </div>
                </div>

                <SheetFooter className="p-6 border-t flex-row gap-2 sm:justify-end">
                  <Button type="submit" disabled={processing} className="text-xs">
                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" type="button" className="text-xs" disabled={processing}>Batal</Button>
                  </SheetClose>
                </SheetFooter>
              </>
            )}
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
}

AdsAffiliate.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Iklan & Affiliate', href: AdsAffiliateController.index() },
  ],
};

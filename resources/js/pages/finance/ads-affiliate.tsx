/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link, router } from '@inertiajs/react';
import { Box, DollarSign, FileSpreadsheet, Megaphone, MoreHorizontalIcon, PencilIcon, Percent, Plus, Search, Store, Trash2, Trash2Icon, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdsAffiliateController from '@/actions/App/Http/Controllers/AdsAffiliateController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdsAffiliate({ adsExpenses, storesList, filters, summary }: any) {
  // State Kontrol Sheet (Tambah, Edit, Detail) sesuai standard product.tsx
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);
  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false);

  // State Aksi Form Sekaligus & Bulk Selection
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [storeId, setStoreId] = useState<string>('');

  // ---- STATE FILTER SERVER-SIDE ----
  const [storeFilter, setStoreFilter] = useState(filters?.store_id || 'all');
  const [startDate, setStartDate] = useState(filters?.start_date || '');
  const [endDate, setEndDate] = useState(filters?.end_date || '');

  // ---- STATE FORM NOMINAL (RAW vs DISPLAY) ----
  const [rawAmount, setRawAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');

  // 1. TAMBAHKAN STATE BARU INI:
  const [rawAffiliate, setRawAffiliate] = useState('');
  const [displayAffiliate, setDisplayAffiliate] = useState('');

  // Reset pilihan data saat prop adsExpenses berubah / sync state edit
  useEffect(() => {
    setSelectedIds([]);

    if (selectedExpense) {
      setStoreId(selectedExpense.store_id?.toString() || '');
      setRawAmount(selectedExpense.amount_spent?.toString() || '');
      setDisplayAmount(new Intl.NumberFormat('id-ID').format(selectedExpense.amount_spent || 0));

      // 2. TAMBAHKAN INI: Sync data affiliate saat tombol edit diklik
      setRawAffiliate(selectedExpense.affiliate_fee?.toString() || '');
      setDisplayAffiliate(new Intl.NumberFormat('id-ID').format(selectedExpense.affiliate_fee || 0));
    } else {
      setStoreId('');
    }
  }, [adsExpenses, selectedExpense]);

  // 3. TAMBAHKAN HANDLER MASKING BARU INI:
  const handleAffiliateChange = (e: any) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setRawAffiliate(numericValue);
    if (numericValue) {
      setDisplayAffiliate(new Intl.NumberFormat('id-ID').format(numericValue));
    } else {
      setDisplayAffiliate('');
    }
  };

  // Effect Server-side Search & Filtering dengan Debounce 300ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get(
        AdsAffiliateController.index(),
        {
          search: search,
          store_id: storeFilter,
          start_date: startDate,
          end_date: endDate
        },
        { preserveState: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, storeFilter, startDate, endDate]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = adsExpenses.data.map((item: any) => item.id);
      setSelectedIds(allIds);
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
    router.post('/finance/ads-affiliate/bulk-delete', {
      ids: selectedIds
    }, {
      onSuccess: () => setSelectedIds([]),
      preserveScroll: true
    });
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const idsQuery = selectedIds.join(',');
    window.location.href = `/finance/ads-affiliate/export?ids=${idsQuery}`;
  };

  const resetForm = () => {
    setRawAmount('');
    setDisplayAmount('');
    setRawAffiliate('');
    setDisplayAffiliate('');
    setSelectedExpense(null);
    setStoreId('');
  };

  const handleAmountChange = (e: any) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setRawAmount(numericValue);
    if (numericValue) {
      setDisplayAmount(new Intl.NumberFormat('id-ID').format(numericValue));
    } else {
      setDisplayAmount('');
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace('.', ':');
    return { dateStr, timeStr };
  };

  const getRatioBadgeVariant = (ratio: number) => {
    if (ratio > 15) return "destructive";
    return "default";
  };

  return (
    <>
      <Head title="Iklan & Affiliate" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        {/* HEADING & ACTIONS */}
        <div className="flex items-center justify-between">
          <Heading
            title="Iklan & Affiliate"
            description="Pantau efisiensi marketing ads dan penyerapan komisi affiliate toko Anda."
          />
          <div className="flex flex-wrap gap-2">
            <Sheet
              open={isSheetOpen}
              onOpenChange={(open) => {
                setIsSheetOpen(open);
                if (!open) resetForm();
              }}
            >
              <SheetTrigger asChild>
                <Button className="capitalize">
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

                {/* Wrapper Form Komponen khusus sesuai product.tsx */}
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

                        {/* Select Input Toko */}
                        <div className="grid gap-3">
                          <Label htmlFor="store_id">Pilih Toko</Label>
                          <Select value={storeId} onValueChange={setStoreId}>
                            <SelectTrigger id="store_id" className="w-full bg-background">
                              <SelectValue placeholder="-- Pilih Toko --" />
                            </SelectTrigger>
                            <SelectContent>
                              {storesList && storesList.length > 0 ? (
                                storesList.map((store: any) => (
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

                        {/* Input Tanggal Catatan */}
                        <div className="grid gap-3">
                          <Label htmlFor="date">Tanggal Pengeluaran</Label>
                          <Input
                            id="date"
                            type="date"
                            name="date"
                            required
                            defaultValue={new Date().toISOString().split('T')[0]}
                          />
                          <InputError message={errors.date} />
                        </div>

                        {/* Input Nominal Iklan (Format Rupiah Tersembunyi) */}
                        <div className="grid gap-3">
                          <Label htmlFor="amount_spent">Biaya Iklan / Ads (Rp)</Label>
                          <input type="hidden" name="amount_spent" value={rawAmount} required />
                          <Input
                            id="amount_spent"
                            type="text"
                            value={displayAmount}
                            onChange={handleAmountChange}
                            placeholder="150.000"
                          />
                          <InputError message={errors.amount_spent} />
                        </div>

                        {/* Input Opsional: Komisi Affiliate */}
                        <div className="grid gap-3">
                          <Label htmlFor="affiliate_fee">Komisi Affiliate / Anggaran Berjalan (Rp) <span className="text-muted-foreground text-[10px]">(Opsional)</span></Label>
                          <input type="hidden" name="affiliate_fee" value={rawAffiliate} />
                          <Input
                            id="affiliate_fee"
                            type="text"
                            value={displayAffiliate}
                            onChange={handleAffiliateChange}
                            placeholder="50.000"
                          />
                          <InputError message={errors.affiliate_fee} />
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor="description">Catatan Tambahan</Label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Contoh: Naikkan budget iklan karena campaign tanggal kembar..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <InputError message={errors.description} />
                        </div>

                      </div>

                      <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                        <Button
                          type="submit"
                          variant="secondary"
                          disabled={processing}
                          onClick={() => setSubmitAction('save')}
                        >
                          {processing && submitAction === 'save' ? 'Menyimpan...' : 'Simpan Data'}
                        </Button>
                        <Button
                          type="submit"
                          disabled={processing}
                          onClick={() => setSubmitAction('save_and_add')}
                        >
                          {processing && submitAction === 'save_and_add' ? 'Menyimpan...' : 'Simpan & Tambah Lagi'}
                        </Button>
                        <SheetClose asChild>
                          <Button variant="outline" type="button" disabled={processing}>Batal</Button>
                        </SheetClose>
                      </SheetFooter>
                    </>
                  )}
                </Form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* METRICS CARDS PANEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-sidebar-border/70 bg-card">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Total Biaya Iklan</span>
              <Megaphone className="h-4 w-4 text-blue-500" />
            </div>
            <div className="px-4 pb-4">
              <div className="text-xl font-extrabold tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(summary?.total_ads || 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Akumulasi bakar saldo iklan harian</p>
            </div>
          </Card>

          <Card className="border-sidebar-border/70 bg-card">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Total Komisi Affiliate</span>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </div>
            <div className="px-4 pb-4">
              <div className="text-xl font-extrabold tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(summary?.total_affiliate || 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Potongan dari order terafiliasi</p>
            </div>
          </Card>

          <Card className="border-sidebar-border/70 bg-card">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-muted-foreground">Total Beban Marketing</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="px-4 pb-4">
              <div className="text-xl font-extrabold tracking-tight">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(summary?.total_marketing_cost || 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Gabungan Iklan + Affiliate</p>
            </div>
          </Card>

          <Card className="border-sidebar-border/70 bg-card">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-muted-foreground">Rasio Beban / Omzet</span>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">{summary?.marketing_ratio_percentage || 0}%</span>
                <Badge variant={getRatioBadgeVariant(summary?.marketing_ratio_percentage || 0)}>
                  {(summary?.marketing_ratio_percentage || 0) > 15 ? '⚠️ Boros' : '✅ Sehat'}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Batas aman pengeluaran ideal &lt; 15%</p>
            </div>
          </Card>
        </div>

        {/* BARIS SEKSI FILTER UTAMA */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full bg-card p-3 rounded-lg border border-sidebar-border/60">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

            {/* Filter Rentang Tanggal Mulai */}
            <Input
              type="date"
              className="w-full sm:w-[150px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">s/d</span>
            {/* Filter Rentang Tanggal Selesai */}
            <Input
              type="date"
              className="w-full sm:w-[150px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            {/* Filter Dropdown Toko */}
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {storesList && storesList.map((store: any) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kotak Input Pencarian di Sisi Kanan Sebaris */}
          <div className="relative w-full max-w-sm sm:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari toko, catatan, nominal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <div className="p-6">
            <Table>
              <TableCaption className='py-6'>Daftar log rincian biaya marketing operasional iklan toko.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={adsExpenses.data.length > 0 && selectedIds.length === adsExpenses.data.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Icon Lapak</TableHead>
                  <TableHead>Waktu Log</TableHead>
                  <TableHead>Nama Toko</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Biaya Iklan</TableHead>
                  <TableHead className="text-right">Komisi Affiliate</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adsExpenses.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Box />
                          </EmptyMedia>
                          <EmptyTitle>Belum ada data</EmptyTitle>
                          <EmptyDescription>Tidak ada rekaman data biaya marketing yang ditemukan.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  adsExpenses.data.map((item: any, index: any) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <TableRow
                        key={item.id}
                        className={`
                          cursor-pointer transition-colors hover:bg-muted/70
                          ${isSelected ? 'bg-muted/60 hover:bg-muted/60' : index % 2 === 1 ? 'bg-muted/25' : 'bg-background'}
                        `}
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
                        <TableCell>
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border text-muted-foreground/60">
                            <Store className="h-4 w-4" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm text-foreground">
                              {formatDateTime(item.date).dateStr}
                            </span>
                            <span className="text-xs text-muted-foreground italic">
                              Pukul {formatDateTime(item.created_at).timeStr} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{item.store?.name || 'Toko Terhapus'}</TableCell>
                        <TableCell>
                          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 capitalize">
                            {item.store?.platform || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.amount_spent)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-purple-600">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.affiliate_fee || 0)}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontalIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedExpense(item);
                                    setStoreId(item.store_id);
                                    setRawAmount(item.amount_spent.toString());
                                    setDisplayAmount(new Intl.NumberFormat('id-ID').format(item.amount_spent));
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
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Data log pengeluaran saldo marketing akan dihapus permanen.
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
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* PAGINATION PANEL */}
            {adsExpenses.last_page > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t border-sidebar-border/50 dark:border-sidebar-border">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Menampilkan {adsExpenses.from ?? 0} sampai {adsExpenses.to ?? 0} dari {adsExpenses.total ?? 0} log
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!adsExpenses.prev_page_url}
                    onClick={() => adsExpenses.prev_page_url && router.get(adsExpenses.prev_page_url, {}, { preserveState: true })}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-xs md:text-sm font-medium px-2">
                    Hal {adsExpenses.current_page} dari {adsExpenses.last_page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!adsExpenses.next_page_url}
                    onClick={() => adsExpenses.next_page_url && router.get(adsExpenses.next_page_url, {}, { preserveState: true })}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= KOTAK MELAYANG (FLOATING ACTION BAR) ================= */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/4 z-50 flex items-center gap-4 rounded-full border bg-background/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
            <strong className="text-foreground font-semibold">{selectedIds.length}</strong> log terpilih
          </span>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="rounded-full text-xs h-8">
              Batal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              className="rounded-full gap-1.5 text-xs h-8 border-emerald-600/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/20"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-full gap-1.5 text-xs h-8 bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Terpilih
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan menghapus massal sebanyak <strong className="text-foreground font-semibold">{selectedIds.length} data log</strong> sekaligus secara permanen.
                  </AlertDialogDescription>
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

      {/* ================= SHEET DETAIL LOG MARKETING ================= */}
      <Sheet
        open={isSheetOpenDetail}
        onOpenChange={(open) => {
          setIsSheetOpenDetail(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Rincian Log Marketing</SheetTitle>
            <SheetDescription>Rincian lengkap pengeluaran dana iklan harian.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {selectedExpense && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Toko Operasional</span>
                  <span className="text-base font-semibold text-foreground">{selectedExpense.store?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b pb-3 dark:border-sidebar-border">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Biaya Terbakar (Ads)</span>
                    <span className="text-lg font-extrabold text-blue-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedExpense.amount_spent)}
                    </span>
                  </div>

                  {/* TAMBAHAN: Tampilkan Nominal Affiliate di Detail */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Komisi Affiliate</span>
                    <span className="text-lg font-extrabold text-purple-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedExpense.affiliate_fee || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Platform Toko</span>
                  <div>
                    <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 capitalize mt-0.5">
                      {selectedExpense.store?.platform}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Catatan Pengeluaran</span>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {selectedExpense.description || <span className="text-muted-foreground italic text-xs">Tidak ada catatan untuk data ini.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
          <SheetFooter className="p-6 border-t bg-background mt-auto">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Tutup Detail</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ================= SHEET EDIT LOG MARKETING ================= */}
      <Sheet
        open={isSheetOpenEdit}
        onOpenChange={(open) => {
          setIsSheetOpenEdit(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Edit Pengeluaran Marketing</SheetTitle>
            <SheetDescription>Sesuaikan kembali nominal pengeluaran iklan toko Anda.</SheetDescription>
          </SheetHeader>

          <Form
            key={selectedExpense?.id}
            {...AdsAffiliateController.update.form(selectedExpense?.id ?? 0)}
            options={{ preserveScroll: true }}
            onSuccess={() => {
              setIsSheetOpenEdit(false);
              resetForm();
            }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {({ processing, errors }) => (
              <>
                <div className="grid flex-1 auto-rows-min gap-6 px-6 py-4 overflow-y-auto no-scrollbar">
                  <div className="grid gap-3">
                    <Label htmlFor="store_id_edit">Nama Toko</Label>
                    <Select value={storeId} onValueChange={setStoreId}>
                      <SelectTrigger id="store_id_edit" className="w-full bg-background">
                        <SelectValue placeholder="-- Pilih Toko --" />
                      </SelectTrigger>
                      <SelectContent>
                        {storesList && storesList.map((store: any) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="store_id" value={storeId} />
                    <InputError message={errors.store_id} />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="amount_spent_edit">Biaya Iklan / Ads (Rp)</Label>
                    <input type="hidden" name="amount_spent" value={rawAmount} required />
                    <Input
                      id="amount_spent_edit"
                      type="text"
                      value={displayAmount}
                      onChange={handleAmountChange}
                    />
                    <InputError message={errors.amount_spent} />
                  </div>

                  {/* TAMBAHAN INPUT DI FORM EDIT */}
                  <div className="grid gap-3">
                    <Label htmlFor="affiliate_fee_edit">Komisi Affiliate (Rp)</Label>
                    <input type="hidden" name="affiliate_fee" value={rawAffiliate} />
                    <Input
                      id="affiliate_fee_edit"
                      type="text"
                      value={displayAffiliate}
                      onChange={handleAffiliateChange}
                    />
                    <InputError message={errors.affiliate_fee} />
                  </div>

                  {/* TAMBAHAN TEXTAREA DI FORM EDIT */}
                  <div className="grid gap-3">
                    <Label htmlFor="description_edit">Catatan Tambahan</Label>
                    <textarea
                      id="description_edit"
                      name="description"
                      rows={3}
                      defaultValue={selectedExpense?.description || ''}
                      placeholder="Catatan campaign atau pengeluaran..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <InputError message={errors.description} />
                  </div>
                </div>

                <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" type="button" disabled={processing}>Batal</Button>
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
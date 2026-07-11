import { Form, Head, Link, router } from '@inertiajs/react';
import { Archive, AlertTriangle, Box, CheckCircle, ClipboardList, MoreHorizontalIcon, PencilIcon, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import OperationalSupplyController from '@/actions/App/Http/Controllers/OperationalSupplyController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Supplies({ supplies, logs, summary, filters }: { supplies: any, logs: any, summary: any, filters: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const isFirstMount = useRef(true);

  // States untuk Filter & Pencarian
  const [search, setSearch] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

  // States untuk Modal / Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);

  // Form unit suggestions helper & state
  const commonUnits = ['pcs', 'roll', 'pack', 'lembar', 'box', 'meter', 'kg'];
  const [unitVal, setUnitVal] = useState('');
  const [editUnitVal, setEditUnitVal] = useState('');
  const [autoDeduct, setAutoDeduct] = useState(false);
  const [editAutoDeduct, setEditAutoDeduct] = useState(false);

  // Form submission helpers
  const [formKey, setFormKey] = useState(0);
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add' | 'update'>('save');

  // Price styling helpers
  const [rawPrice, setRawPrice] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');

  // Sembunyikan flash loading transisi 300ms agar smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Sync filters to search/status changes (Debounce / trigger on search change)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const delayDebounce = setTimeout(() => {
      router.get(
        OperationalSupplyController.index(),
        {
          search: search,
          status: statusFilter,
        },
        {
          preserveState: true,
          replace: true,
          preserveScroll: true,
        }
      );
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handlePriceChange = (value: string, setRaw: any, setDisplay: any) => {
    const numericValue = value.replace(/\D/g, '');
    setRaw(numericValue);

    if (numericValue) {
      setDisplay(new Intl.NumberFormat('id-ID').format(parseInt(numericValue)));
    } else {
      setDisplay('');
    }
  };

  const resetForm = () => {
    setRawPrice('');
    setDisplayPrice('');
    setUnitVal('');
    setAutoDeduct(false);
  };

  return (
    <>
      <Head title="Bahan Operasional" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <Heading
            title="Bahan Operasional"
            description="Kelola stok kertas thermal, kemasan, lakban, dan perlengkapan packing"
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
                  Tambah Bahan
                </Button>
              </SheetTrigger>

              <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
                <SheetHeader className="p-6 pb-0">
                  <SheetTitle>Tambah Bahan Operasional</SheetTitle>
                  <SheetDescription>
                    Masukkan rincian bahan operasional baru Anda. Klik simpan jika sudah selesai.
                  </SheetDescription>
                </SheetHeader>

                <Form
                  key={`add-supply-form-${formKey}`}
                  {...OperationalSupplyController.store.form()}
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
                      <div className="grid flex-1 auto-rows-min gap-5 px-6 py-4 overflow-y-auto no-scrollbar">
                        {/* Nama Bahan */}
                        <div className="grid gap-2">
                          <Label htmlFor="name">Nama Bahan</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Contoh: Kertas Thermal 57x30, Lakban Bening"
                            required
                          />
                          <InputError message={errors.name} />
                        </div>

                        {/* Baris Stok & Satuan */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="stock">Jumlah Stok Awal</Label>
                            <Input
                              id="stock"
                              name="stock"
                              type="number"
                              min="0"
                              placeholder="Contoh: 10"
                              required
                            />
                            <InputError message={errors.stock} />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="unit">Satuan</Label>
                            <Input
                              id="unit"
                              name="unit"
                              value={unitVal}
                              onChange={(e) => setUnitVal(e.target.value)}
                              placeholder="Contoh: roll, pcs, pack"
                              required
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {commonUnits.map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => setUnitVal(u)}
                                  className="text-[10px] px-1.5 py-0.5 rounded border bg-muted hover:bg-muted-foreground/15 text-muted-foreground transition-colors"
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                            <InputError message={errors.unit} />
                          </div>
                        </div>

                        {/* Stok Minimum (Batas Peringatan) */}
                        <div className="grid gap-2">
                          <Label htmlFor="min_stock">Stok Minimum (Batas Peringatan)</Label>
                          <Input
                            id="min_stock"
                            name="min_stock"
                            type="number"
                            min="0"
                            placeholder="Beri peringatan jika stok di bawah angka ini"
                            required
                          />
                          <InputError message={errors.min_stock} />
                        </div>

                        {/* Harga Beli Satuan */}
                        <div className="grid gap-2">
                          <Label htmlFor="purchase_price">Harga Beli Satuan (Rp)</Label>
                          <input type="hidden" name="purchase_price" value={rawPrice} />
                          <Input
                            id="purchase_price"
                            type="text"
                            value={displayPrice}
                            onChange={(e) => {
                              handlePriceChange(e.target.value, setRawPrice, setDisplayPrice);
                            }}
                            placeholder="Contoh: 5.500"
                            required
                          />
                          <InputError message={errors.purchase_price} />
                        </div>

                        {/* Catatan / Keterangan */}
                        <div className="grid gap-2">
                          <Label htmlFor="note">Catatan / Link Pembelian</Label>
                          <Input
                            id="note"
                            name="note"
                            placeholder="Contoh: Beli di toko Shopee X, simpan di laci bawah"
                          />
                          <InputError message={errors.note} />
                        </div>

                        {/* Auto-Deduct Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                          <div className="space-y-0.5">
                            <Label htmlFor="auto_deduct" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Potong Otomatis Saat Transaksi</Label>
                            <p className="text-xs text-muted-foreground">Kurangi stok bahan ini secara otomatis 1 unit setiap ada transaksi aktif</p>
                          </div>
                          <input type="hidden" name="auto_deduct" value={autoDeduct ? '1' : '0'} />
                          <Switch
                            id="auto_deduct"
                            checked={autoDeduct}
                            onCheckedChange={setAutoDeduct}
                          />
                        </div>
                      </div>

                      <SheetFooter className="p-6 border-t bg-background mt-auto flex flex-col gap-2">
                        <div className="flex gap-2 w-full">
                          <Button
                            type="submit"
                            variant="outline"
                            className="flex-1"
                            disabled={processing}
                            onClick={() => setSubmitAction('save_and_add')}
                          >
                            Simpan & Tambah Lagi
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={processing}
                            onClick={() => setSubmitAction('save')}
                          >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                          </Button>
                        </div>
                      </SheetFooter>
                    </>
                  )}
                </Form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ================= BARIS KARTU RINGKASAN KPI ================= */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Total Bahan */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-card p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:h-1.5 transition-all" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Jenis Bahan</span>
                <p className="text-3xl font-extrabold tracking-tight text-foreground font-mono">{summary.total_items}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/30 group-hover:scale-110 transition-transform">
                <ClipboardList className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Bahan operasional terdaftar di sistem</p>
          </div>

          {/* Card 2: Stok Menipis */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-card p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-rose-500 group-hover:h-1.5 transition-all" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok Menipis / Habis</span>
                <div className="flex items-center gap-2">
                  <p className={`text-3xl font-extrabold tracking-tight font-mono ${summary.low_stock_items > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-foreground'}`}>
                    {summary.low_stock_items}
                  </p>
                  {summary.low_stock_items > 0 && (
                    <span className="relative flex size-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
              </div>
              <div className={`flex size-12 items-center justify-center rounded-xl border group-hover:scale-110 transition-transform ${summary.low_stock_items > 0
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450 border-rose-100/30'
                : 'bg-zinc-50 text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-500 border-zinc-100/30'
                }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Segera beli persediaan bahan sebelum kehabisan</p>
          </div>

          {/* Card 3: Stok Aman */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-card p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:h-1.5 transition-all" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok Aman</span>
                <p className="text-3xl font-extrabold tracking-tight text-foreground font-mono">{summary.safe_stock_items}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/30 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Persediaan stok masih mencukupi</p>
          </div>
        </div>

        {/* ================= TABS NAVIGATION PERSYARATAN/LOGS ================= */}
        <Tabs defaultValue="list" className="w-full flex-1 flex flex-col gap-4">
          <TabsList className="w-fit bg-zinc-105 dark:bg-zinc-800 p-1 rounded-xl">
            <TabsTrigger value="list" className="rounded-lg text-xs">Persediaan Bahan</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg text-xs">Riwayat Aktivitas</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex flex-col gap-4 flex-1 m-0">
            {/* ================= PANEL FILTER PENCARIAN & STATUS ================= */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Filter Dropdown Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                    <SelectValue placeholder="Semua Status Stok" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Semua Persediaan</SelectItem>
                    <SelectItem value="low">🚨 Stok Menipis</SelectItem>
                    <SelectItem value="safe">✅ Stok Aman</SelectItem>
                  </SelectContent>
                </Select>

                {(search !== '' || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                    }}
                    className="text-xs h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>

              {/* Kotak Input Pencarian */}
              <div className="relative w-full sm:w-80 sm:ml-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <Input
                  type="search"
                  placeholder="Cari bahan operasional..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80"
                />
              </div>
            </div>

            {/* ================= TABEL DATA UTAMA BAHAN OPERASIONAL ================= */}
            {isLoading ? (
              <SuppliesTableSkeleton />
            ) : (
              <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
                <div className="p-0">
                  <Table>
                    <TableCaption className="py-6 text-zinc-400 dark:text-zinc-500">Daftar stok bahan pembungkus dan perlengkapan logistik toko Anda.</TableCaption>
                    <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                      <TableRow>
                        <TableHead className="text-xs w-[60px] text-center">Status</TableHead>
                        <TableHead className="text-xs">Nama Perlengkapan</TableHead>
                        <TableHead className="text-xs text-center">Stok Saat Ini</TableHead>
                        <TableHead className="text-xs">Satuan</TableHead>
                        <TableHead className="text-xs text-center">Min. Alert</TableHead>
                        <TableHead className="text-xs">Harga Beli Satuan</TableHead>
                        <TableHead className="text-xs">Catatan / Rincian</TableHead>
                        <TableHead className="text-xs text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplies.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                            <Empty>
                              <EmptyHeader>
                                <EmptyMedia variant="icon"><Archive /></EmptyMedia>
                                <EmptyTitle>Bahan Belum Ada</EmptyTitle>
                                <EmptyDescription>Tidak ditemukan data perlengkapan operasional.</EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          </TableCell>
                        </TableRow>
                      ) : (
                        supplies.data.map((item: any) => {
                          const isLow = item.stock <= item.min_stock;
                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800/60"
                            >
                              {/* Kolom Status Warning */}
                              <TableCell className="text-center">
                                {isLow ? (
                                  <div className="inline-flex relative items-center justify-center">
                                    <span className="absolute animate-ping size-2.5 rounded-full bg-rose-400 opacity-75"></span>
                                    <AlertTriangle className="h-4 w-4 text-rose-500 relative z-10" />
                                  </div>
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-emerald-500 inline-block" />
                                )}
                              </TableCell>

                              {/* Nama Bahan */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{item.name}</span>
                                  {item.auto_deduct && (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-750 border-indigo-250 dark:bg-indigo-950/40 dark:text-indigo-400 text-[9px] font-bold py-0.5 px-1.5 h-5">
                                      Auto-Deduct
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              {/* Stok dengan Inline Updater Popover */}
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                <InlineStockUpdater supply={item} />
                              </TableCell>

                              {/* Satuan */}
                              <TableCell>
                                <Badge variant="outline" className="capitalize bg-muted/40 font-mono text-[10px]">
                                  {item.unit}
                                </Badge>
                              </TableCell>

                              {/* Minimum alert */}
                              <TableCell className="text-center font-mono font-medium text-xs text-zinc-500">
                                {item.min_stock} {item.unit}
                              </TableCell>

                              {/* Harga Beli Satuan */}
                              <TableCell className="font-mono text-xs">
                                {item.purchase_price > 0 ? (
                                  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.purchase_price)
                                ) : (
                                  <span className="text-muted-foreground italic text-[10px]">Belum Diisi</span>
                                )}
                              </TableCell>

                              {/* Catatan */}
                              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                {item.note || '-'}
                              </TableCell>

                              {/* Aksi */}
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <AlertDialog>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-8">
                                        <MoreHorizontalIcon className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedSupply(item);
                                          setEditUnitVal(item.unit);
                                          setEditAutoDeduct(!!item.auto_deduct);
                                          setRawPrice(item.purchase_price.toString());
                                          setDisplayPrice(new Intl.NumberFormat('id-ID').format(item.purchase_price));
                                          setIsSheetOpenEdit(true);
                                        }}
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                        Ubah Bahan
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-650 hover:text-red-700 cursor-pointer">
                                          <Trash2 className="h-4 w-4" />
                                          Hapus Bahan
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                  </DropdownMenu>

                                  {/* Alert Dialog Delete */}
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Data bahan operasional <strong>{item.name}</strong> akan dihapus secara permanen dari server.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl text-xs">Batal</AlertDialogCancel>
                                      <Link
                                        href={OperationalSupplyController.destroy(item.id)}
                                        method="delete"
                                        as="button"
                                        className="inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4"
                                      >
                                        Hapus
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

                  {/* Pagination */}
                  {supplies.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-150 dark:border-zinc-800/60">
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">
                        Menampilkan {supplies.from ?? 0} sampai {supplies.to ?? 0} dari {supplies.total ?? 0} bahan
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 rounded-xl"
                          disabled={!supplies.prev_page_url}
                          onClick={() => supplies.prev_page_url && router.get(supplies.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                        >
                          Sebelumnya
                        </Button>
                        <div className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 px-1">
                          Hal {supplies.current_page} dari {supplies.last_page}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 rounded-xl"
                          disabled={!supplies.next_page_url}
                          onClick={() => supplies.next_page_url && router.get(supplies.next_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ================= TABEL RIWAYAT AKTIVITAS ================= */}
          <TabsContent value="logs" className="flex flex-col gap-4 flex-1 m-0">
            <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
              <div className="p-0">
                <Table>
                  <TableCaption className="py-6 text-zinc-400 dark:text-zinc-500">Catatan riwayat perubahan stok bahan operasional.</TableCaption>
                  <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                    <TableRow>
                      <TableHead className="text-xs">Tanggal & Waktu</TableHead>
                      <TableHead className="text-xs">Bahan Operasional</TableHead>
                      <TableHead className="text-xs text-center">Perubahan</TableHead>
                      <TableHead className="text-xs">Sumber</TableHead>
                      <TableHead className="text-xs">Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon"><Archive /></EmptyMedia>
                              <EmptyTitle>Belum Ada Riwayat</EmptyTitle>
                              <EmptyDescription>Belum ada catatan aktivitas perubahan stok saat ini.</EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.data.map((log: any) => {
                        const isPositive = log.adjustment > 0;
                        const formattedDate = new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <TableRow
                            key={log.id}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800/60"
                          >
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {formattedDate}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              {log.operational_supply_name || (log.operational_supply?.name ?? '-')}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={`font-mono text-xs font-bold py-0.5 px-2 rounded-full ${isPositive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/40 dark:text-rose-450'
                                  }`}
                              >
                                {isPositive ? `+${log.adjustment}` : log.adjustment}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase font-bold tracking-wider ${log.source === 'transaction'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400'
                                  : log.source === 'quick_update'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                                    : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                                  }`}
                              >
                                {log.source === 'transaction' ? 'Transaksi' : log.source === 'quick_update' ? 'Quick Update' : 'Manual'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.description}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Pagination for Logs */}
                {logs.last_page > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-150 dark:border-zinc-800/60">
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      Menampilkan {logs.from ?? 0} sampai {logs.to ?? 0} dari {logs.total ?? 0} catatan
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 rounded-xl"
                        disabled={!logs.prev_page_url}
                        onClick={() => logs.prev_page_url && router.get(logs.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                      >
                        Sebelumnya
                      </Button>
                      <div className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 px-1">
                        Hal {logs.current_page} dari {logs.last_page}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 rounded-xl"
                        disabled={!logs.next_page_url}
                        onClick={() => logs.next_page_url && router.get(logs.next_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ================= SHEET FORM UBAH/EDIT BAHAN OPERASIONAL ================= */}
      <Sheet
        open={isSheetOpenEdit}
        onOpenChange={(open) => {
          setIsSheetOpenEdit(open);
          if (!open) {
            setSelectedSupply(null);
            resetForm();
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Ubah Bahan Operasional</SheetTitle>
            <SheetDescription>
              Perbarui rincian informasi untuk bahan operasional terpilih. Klik simpan jika sudah selesai.
            </SheetDescription>
          </SheetHeader>

          {selectedSupply && (
            <Form
              key={`edit-supply-form-${selectedSupply.id}`}
              {...OperationalSupplyController.update.form(selectedSupply.id)}
              options={{ preserveScroll: true }}
              onSuccess={() => {
                setIsSheetOpenEdit(false);
                setSelectedSupply(null);
                resetForm();
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {({ processing, errors }) => (
                <>
                  <div className="grid flex-1 auto-rows-min gap-5 px-6 py-4 overflow-y-auto no-scrollbar">
                    {/* Nama Bahan */}
                    <div className="grid gap-2">
                      <Label htmlFor="edit_name">Nama Bahan</Label>
                      <Input
                        id="edit_name"
                        name="name"
                        defaultValue={selectedSupply.name || ''}
                        placeholder="Nama Bahan"
                        required
                      />
                      <InputError message={errors.name} />
                    </div>

                    {/* Baris Stok & Satuan */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit_stock">Jumlah Stok</Label>
                        <Input
                          id="edit_stock"
                          name="stock"
                          type="number"
                          min="0"
                          defaultValue={selectedSupply.stock ?? ''}
                          required
                        />
                        <InputError message={errors.stock} />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit_unit">Satuan</Label>
                        <Input
                          id="edit_unit"
                          name="unit"
                          value={editUnitVal}
                          onChange={(e) => setEditUnitVal(e.target.value)}
                          required
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {commonUnits.map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setEditUnitVal(u)}
                              className="text-[10px] px-1.5 py-0.5 rounded border bg-muted hover:bg-muted-foreground/15 text-muted-foreground transition-colors"
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                        <InputError message={errors.unit} />
                      </div>
                    </div>

                    {/* Stok Minimum (Batas Peringatan) */}
                    <div className="grid gap-2">
                      <Label htmlFor="edit_min_stock">Stok Minimum (Batas Peringatan)</Label>
                      <Input
                        id="edit_min_stock"
                        name="min_stock"
                        type="number"
                        min="0"
                        defaultValue={selectedSupply.min_stock ?? ''}
                        required
                      />
                      <InputError message={errors.min_stock} />
                    </div>

                    {/* Harga Beli Satuan */}
                    <div className="grid gap-2">
                      <Label htmlFor="edit_purchase_price">Harga Beli Satuan (Rp)</Label>
                      <input type="hidden" name="purchase_price" value={rawPrice} />
                      <Input
                        id="edit_purchase_price"
                        type="text"
                        value={displayPrice}
                        onChange={(e) => {
                          handlePriceChange(e.target.value, setRawPrice, setDisplayPrice);
                        }}
                        placeholder="Harga Beli Satuan"
                        required
                      />
                      <InputError message={errors.purchase_price} />
                    </div>

                    {/* Catatan / Keterangan */}
                    <div className="grid gap-2">
                      <Label htmlFor="edit_note">Catatan / Link Pembelian</Label>
                      <Input
                        id="edit_note"
                        name="note"
                        defaultValue={selectedSupply.note || ''}
                      />
                      <InputError message={errors.note} />
                    </div>

                    {/* Auto-Deduct Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                      <div className="space-y-0.5">
                        <Label htmlFor="edit_auto_deduct" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Potong Otomatis Saat Transaksi</Label>
                        <p className="text-xs text-muted-foreground">Kurangi stok bahan ini secara otomatis 1 unit setiap ada transaksi aktif</p>
                      </div>
                      <input type="hidden" name="auto_deduct" value={editAutoDeduct ? '1' : '0'} />
                      <Switch
                        id="edit_auto_deduct"
                        checked={editAutoDeduct}
                        onCheckedChange={setEditAutoDeduct}
                      />
                    </div>
                  </div>

                  <SheetFooter className="p-6 border-t bg-background mt-auto">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={processing}
                    >
                      {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </SheetFooter>
                </>
              )}
            </Form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// Layout breadcrumbs configuration
Supplies.layout = {
  breadcrumbs: [
    { title: 'Stok & Pemasukan', href: '#' },
    { title: 'Bahan Operasional', href: '#' },
  ],
};

// ================= INLINE QUICK STOCK UPDATER POP-OVER COMPONENT =================
function InlineStockUpdater({ supply }: { supply: any }) {
  const [open, setOpen] = useState(false);
  const [stockVal, setStockVal] = useState(supply.stock?.toString() || '0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStockVal(supply.stock?.toString() || '0');
  }, [supply.stock]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    router.put(
      `/operational/supplies/${supply.id}/update-stock`,
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

  const isLowStock = supply.stock <= supply.min_stock;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={`cursor-pointer p-1.5 px-3 rounded text-center font-bold text-sm inline-flex items-center gap-1 transition-colors border ${isLowStock
            ? 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20 dark:bg-destructive/20'
            : 'hover:bg-muted dark:hover:bg-muted/40 border-dashed border-muted-foreground/40 text-foreground'
            }`}
        >
          <span>{supply.stock}</span>
          <span className={`text-xs font-normal ${isLowStock ? 'text-destructive/80' : 'text-muted-foreground'}`}>
            {supply.unit}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
        align="center"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Quick Update Stock</h4>
            <p className="text-xs font-medium text-foreground max-w-[180px] truncate">{supply.name}</p>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={stockVal}
              onChange={(e) => setStockVal(e.target.value)}
              className="h-8 text-sm"
              min="0"
              required
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
            <Button size="sm" className="h-8 px-2.5" type="submit" disabled={loading}>
              {loading ? '...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// ================= HIGH-FIDELITY TABLE SKELETON LOADER =================
function SuppliesTableSkeleton() {
  return (
    <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm animate-pulse">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="text-xs">Nama Perlengkapan</TableHead>
              <TableHead className="text-xs text-center">Stok Saat Ini</TableHead>
              <TableHead className="text-xs">Satuan</TableHead>
              <TableHead className="text-xs text-center">Min. Alert</TableHead>
              <TableHead className="text-xs">Harga Beli Satuan</TableHead>
              <TableHead className="text-xs">Catatan / Rincian</TableHead>
              <TableHead className="text-xs text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={idx} className="border-b border-zinc-100 dark:border-zinc-800/60">
                <TableCell className="text-center">
                  <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </TableCell>
                <TableCell className="text-center">
                  <div className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </TableCell>
                <TableCell className="text-center">
                  <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

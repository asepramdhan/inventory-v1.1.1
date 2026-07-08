/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable @stylistic/padding-line-between-statements */

/* eslint-disable curly */

import { Form, Head, Link, router } from '@inertiajs/react';

import { Calendar, Coins, FileSpreadsheet, Info, MoreHorizontalIcon, Pencil, Percent, Plus, Search, StoreIcon, Trash2 } from 'lucide-react';

import { useEffect, useState } from 'react';

import StoreController from '@/actions/App/Http/Controllers/StoreController';

import Heading from '@/components/heading';

import InputError from '@/components/input-error';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Checkbox } from '@/components/ui/checkbox';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { Switch } from '@/components/ui/switch';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';



export default function Store({ stores, filters }: any) {

  // State Kontrol Sheet (Tambah, Edit, Detail)

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);

  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false); // State baru untuk Detail



  // State Pencarian, Pilihan Checkbox, & Data Toko Terpilih

  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');

  const [formKey, setFormKey] = useState(0);

  const [search, setSearch] = useState(filters?.search || '');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [selectedStore, setSelectedStore] = useState<any>(null);



  // ---- STATE BARU: FILTER PLATFORM & STATUS ----

  const [platformFilter, setPlatformFilter] = useState(filters?.platform || 'all');

  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

  // -----------------------------------------------



  // State Form fields

  const [platform, setPlatform] = useState('shopee');

  const [rawPrice, setRawPrice] = useState('');

  const [displayPrice, setDisplayPrice] = useState('');

  const [isActive, setIsActive] = useState(true);



  // Reset pilihan saat data stores berubah

  useEffect(() => {

    setSelectedIds([]);

  }, [stores]);



  // Effect untuk server-side search & filtering dengan debounce 300ms

  useEffect(() => {

    const delayDebounceFn = setTimeout(() => {

      router.get(

        StoreController.index(),

        {

          search: search,

          platform: platformFilter,

          status: statusFilter

        },

        { preserveState: true, replace: true }

      );

    }, 300);



    return () => clearTimeout(delayDebounceFn);

  }, [search, platformFilter, statusFilter]);



  const handleSelectAll = (checked: boolean) => {

    if (checked) {

      const allIds = stores.data.map((store: any) => store.id);

      setSelectedIds(allIds);

    } else {

      setSelectedIds([]);

    }

  };



  const handleSelectRow = (storeId: number, checked: boolean) => {

    if (checked) {

      setSelectedIds((prev) => [...prev, storeId]);

    } else {

      setSelectedIds((prev) => prev.filter((id) => id !== storeId));

    }

  };



  const handleBulkDelete = () => {

    if (selectedIds.length === 0) return;

    router.post('/master-data/store/bulk-delete', {

      ids: selectedIds

    }, {

      onSuccess: () => setSelectedIds([]),

      preserveScroll: true

    });

  };



  // Fungsi Aksi Massal (Export Excel Terpilih)

  const handleBulkExport = () => {

    if (selectedIds.length === 0) return;



    // Menggabungkan array ID menjadi string terpisah koma (misal: 1,2,3)

    const idsQuery = selectedIds.join(',');



    // Menggunakan native browser redirect khusus untuk download file agar tidak merusak state Inertia

    window.location.href = `/master-data/store/export?ids=${idsQuery}`;

  };



  const resetForm = () => {

    setRawPrice('');

    setDisplayPrice('');

    setSelectedStore(null);

    setPlatform('shopee');

    setIsActive(true);

  };



  const handlePriceChange = (e: any) => {

    const numericValue = e.target.value.replace(/\D/g, '');

    setRawPrice(numericValue);

    if (numericValue) {

      setDisplayPrice(new Intl.NumberFormat('id-ID').format(numericValue));

    } else {

      setDisplayPrice('');

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



  const formatPercent = (value: number | string) => {

    if (value === undefined || value === null || value === '') return '-';

    return `${Number(value)}%`;

  };



  return (

    <>

      <Head title="Toko / Marketplace" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 mb-20 relative">

        <div className="flex items-center justify-between">

          <Heading

            title="Toko / Marketplace"

            description="Kelola data toko / marketplace"

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

                  Tambah Toko

                </Button>

              </SheetTrigger>



              {/* SHEET FORM TAMBAH TOKO */}

              <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">

                <SheetHeader className="p-6 pb-0">

                  <SheetTitle>Tambah Toko / Marketplace</SheetTitle>

                  <SheetDescription>Masukkan data toko / marketplace</SheetDescription>

                </SheetHeader>



                <Form

                  key={`add-store-form-${formKey}`}

                  {...StoreController.store.form()}

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

                          <Label htmlFor="platform">Platform</Label>

                          <Select value={platform} onValueChange={setPlatform}>

                            <SelectTrigger id="platform" className='w-full'>

                              <SelectValue />

                            </SelectTrigger>

                            <SelectContent>

                              <SelectItem value="shopee">Shopee</SelectItem>

                              <SelectItem value="lazada">Lazada</SelectItem>

                              <SelectItem value="tiktok">Tiktok</SelectItem>

                            </SelectContent>

                          </Select>

                          <input type="hidden" name="platform" value={platform} />

                          <InputError message={errors.platform} />

                        </div>



                        <div className="grid gap-3">

                          <Label htmlFor="name">Nama Toko</Label>

                          <Input id="name" name="name" required placeholder="Contoh: Toko A" />

                          <InputError message={errors.name} />

                        </div>



                        <div className="grid gap-3">

                          <Label htmlFor="admin_fee">Biaya Admin (%)</Label>

                          <Input id="admin_fee" name="admin_fee" required placeholder="Contoh: 5" />

                          <InputError message={errors.admin_fee} />

                        </div>



                        <div className="grid gap-3">

                          <Label htmlFor="processing_fee">Biaya Proses Pesanan (Rp)</Label>

                          <input type="hidden" name="processing_fee" value={rawPrice} required />

                          <Input

                            id="processing_fee"

                            type="text"

                            value={displayPrice}

                            onChange={handlePriceChange}

                            placeholder="Contoh: 1250"

                          />

                          <InputError message={errors.processing_fee} />

                        </div>



                        <div className="flex items-center justify-between rounded-lg border p-4 bg-card">

                          <div className="space-y-0.5">

                            <Label htmlFor="active" className="text-base">Status Toko</Label>

                            <p className="text-xs text-muted-foreground">

                              {isActive ? 'Toko aktif dan dapat menerima pesanan' : 'Toko nonaktif sementara'}

                            </p>

                          </div>

                          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />

                          <input type="hidden" name="active" value={isActive ? '1' : '0'} />

                        </div>

                      </div>



                      <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">

                        <Button

                          type="submit"

                          variant="secondary"

                          disabled={processing}

                          onClick={() => setSubmitAction('save')}

                        >

                          {processing && submitAction === 'save' ? 'Menyimpan...' : 'Simpan Toko'}

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



        {/* BARIS SEKSI FILTER UTAMA */}

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full bg-card p-3 rounded-lg border border-sidebar-border/60">

          <div className="flex items-center gap-2 w-full sm:w-auto">

            {/* Filter Dropdown Platform */}

            <Select value={platformFilter} onValueChange={setPlatformFilter}>

              <SelectTrigger className="w-full sm:w-[160px]">

                <SelectValue placeholder="Semua Platform" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">Semua Platform</SelectItem>

                <SelectItem value="shopee">Shopee</SelectItem>

                <SelectItem value="lazada">Lazada</SelectItem>

                <SelectItem value="tiktok">Tiktok</SelectItem>

              </SelectContent>

            </Select>



            {/* Filter Dropdown Status */}

            <Select value={statusFilter} onValueChange={setStatusFilter}>

              <SelectTrigger className="w-full sm:w-[150px]">

                <SelectValue placeholder="Semua Status" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">Semua Status</SelectItem>

                <SelectItem value="active">Aktif</SelectItem>

                <SelectItem value="inactive">Tidak Aktif</SelectItem>

              </SelectContent>

            </Select>

          </div>



          {/* Kotak Input Pencarian dipindah ke kanan sebaris dengan filter dropdown */}

          <div className="relative w-full max-w-sm sm:ml-auto">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input

              type="search"

              placeholder="Cari nama toko..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              className="pl-9"

            />

          </div>

        </div>



        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">

          <div className="p-6">

            <Table>

              <TableCaption className='py-6'>Daftar seluruh toko / marketplace yang tersimpan di sistem.</TableCaption>

              <TableHeader>

                <TableRow>

                  <TableHead className="w-[50px]">

                    <Checkbox

                      checked={stores.data.length > 0 && selectedIds.length === stores.data.length}

                      onCheckedChange={(checked) => handleSelectAll(!!checked)}

                      aria-label="Select all"

                    />

                  </TableHead>

                  <TableHead className="w-50">Tanggal</TableHead>

                  <TableHead className='w-30'>Platform</TableHead>

                  <TableHead className="w-30">Nama Toko</TableHead>

                  <TableHead className="w-40 text-center">Admin (%)</TableHead>

                  <TableHead className='w-35'>Proses (Rp)</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-right">Aksi</TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {stores.data.length === 0 ? (

                  <TableRow>

                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">

                      <Empty>

                        <EmptyHeader>

                          <EmptyMedia variant="icon">

                            <StoreIcon />

                          </EmptyMedia>

                          <EmptyTitle>Belum ada data</EmptyTitle>

                          <EmptyDescription>Tidak ada data yang ditemukan.</EmptyDescription>

                        </EmptyHeader>

                      </Empty>

                    </TableCell>

                  </TableRow>

                ) : (

                  stores.data.map((store: any, index: number) => {

                    const isSelected = selectedIds.includes(store.id);

                    return (

                      <TableRow key={store.id}

                        // FITUR: Zebra Striping, Hover & Clickable style

                        className={`

                          cursor-pointer transition-colors hover:bg-muted/70

                          ${isSelected ? 'bg-muted/60 hover:bg-muted/60' : index % 2 === 1 ? 'bg-muted/25' : 'bg-background'}

                        `}

                        // FITUR: Klik baris untuk buka Detail Info Sheet

                        onClick={() => {

                          setSelectedStore(store);

                          setIsSheetOpenDetail(true);

                        }}

                      >

                        {/* Checkbox Cell - StopPropagation agar tidak memicu detil Sheet */}

                        <TableCell onClick={(e) => e.stopPropagation()}>

                          <Checkbox

                            checked={isSelected}

                            onCheckedChange={(checked) => handleSelectRow(store.id, !!checked)}

                            aria-label={`Select ${store.name}`}

                          />

                        </TableCell>

                        <TableCell>

                          <div className="flex flex-col gap-0.5">

                            <span className="font-medium text-sm text-foreground">

                              {formatDateTime(store.created_at).dateStr}

                            </span>

                            <span className="text-xs text-muted-foreground italic">

                              Pukul {formatDateTime(store.created_at).timeStr} WIB

                            </span>

                          </div>

                        </TableCell>

                        <TableCell className='capitalize'>

                          <Badge className={

                            `${store.platform === 'shopee' ? 'bg-orange-600 text-white' : ''} 

                            ${store.platform === 'lazada' ? 'bg-blue-600 text-white' : ''}

                            ${store.platform === 'tiktok' ? 'bg-slate-600 text-white' : ''}`

                          }>

                            {store.platform}

                          </Badge>

                        </TableCell>

                        <TableCell className="font-medium">{store.name}</TableCell>

                        <TableCell className="text-center">{formatPercent(store.admin_fee)}</TableCell>

                        <TableCell>

                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">

                            {new Intl.NumberFormat('id-ID', {

                              style: 'currency',

                              currency: 'IDR',

                              maximumFractionDigits: 0

                            }).format(store.processing_fee)}

                          </Badge>

                        </TableCell>

                        <TableCell>

                          <Badge className={store.active ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}>{store.active ? 'Aktif' : 'Tidak Aktif'}</Badge>

                        </TableCell>

                        {/* Action Cell - StopPropagation agar tidak memicu detil Sheet */}

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>

                          <AlertDialog>

                            <DropdownMenu>

                              <DropdownMenuTrigger asChild>

                                <Button variant="ghost" size="icon" className="size-8">

                                  <MoreHorizontalIcon />

                                  <span className="sr-only">Open menu</span>

                                </Button>

                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">

                                <DropdownMenuItem

                                  onClick={() => {

                                    setSelectedStore(store);

                                    setPlatform(store.platform);

                                    setIsActive(!!store.active);

                                    setRawPrice(store.processing_fee ? String(Number(store.processing_fee)) : '');

                                    setDisplayPrice(store.processing_fee ? new Intl.NumberFormat('id-ID').format(store.processing_fee) : '');

                                    setIsSheetOpenEdit(true);

                                  }}

                                >

                                  <Pencil className="h-4 w-4" />

                                  Edit

                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <AlertDialogTrigger asChild>

                                  <DropdownMenuItem variant="destructive">

                                    <Trash2 className="h-4 w-4" />

                                    Delete

                                  </DropdownMenuItem>

                                </AlertDialogTrigger>

                              </DropdownMenuContent>

                            </DropdownMenu>



                            <AlertDialogContent>

                              <AlertDialogHeader>

                                <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>

                                <AlertDialogDescription>

                                  Tindakan ini tidak dapat dibatalkan. Toko / Marketplace akan dihapus secara permanen dari server.

                                </AlertDialogDescription>

                              </AlertDialogHeader>

                              <AlertDialogFooter>

                                <AlertDialogCancel>Batal</AlertDialogCancel>

                                <Link href={StoreController.destroy(store.id)}>

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



            {stores.last_page > 1 && (

              <div className="flex items-center justify-between px-2 py-4 border-t border-sidebar-border/50 dark:border-sidebar-border">

                <div className="text-xs md:text-sm text-muted-foreground">

                  Menampilkan {stores.from ?? 0} sampai {stores.to ?? 0} dari {stores.total ?? 0} toko

                </div>

                <div className="flex items-center space-x-2">

                  <Button

                    variant="outline"

                    size="sm"

                    disabled={!stores.prev_page_url}

                    onClick={() => stores.prev_page_url && router.get(stores.prev_page_url, {}, { preserveState: true })}

                  >

                    Sebelumnya

                  </Button>

                  <div className="text-xs md:text-sm font-medium px-2">

                    Hal {stores.current_page} dari {stores.last_page}

                  </div>

                  <Button

                    variant="outline"

                    size="sm"

                    disabled={!stores.next_page_url}

                    onClick={() => stores.next_page_url && router.get(stores.next_page_url, {}, { preserveState: true })}

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

            <strong className="text-foreground font-semibold">{selectedIds.length}</strong> toko terpilih

          </span>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-1.5">

            <Button

              variant="ghost"

              size="sm"

              onClick={() => setSelectedIds([])}

              className="rounded-full text-xs h-8"

            >

              Batal

            </Button>



            {/* TOMBOL BARU: EXPORT EXCEL */}

            <Button

              variant="outline"

              size="sm"

              onClick={handleBulkExport}

              className="rounded-full gap-1.5 text-xs h-8 border-emerald-600/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"

            >

              <FileSpreadsheet className="h-3.5 w-3.5" />

              Export Excel

            </Button>



            <AlertDialog>

              <AlertDialogTrigger asChild>

                <Button

                  variant="destructive"

                  size="sm"

                  className="rounded-full gap-1.5 text-xs h-8 bg-red-600 hover:bg-red-700"

                >

                  <Trash2 className="h-3.5 w-3.5" />

                  Hapus Terpilih

                </Button>

              </AlertDialogTrigger>

              <AlertDialogContent>

                <AlertDialogHeader>

                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>

                  <AlertDialogDescription>

                    Tindakan ini tidak dapat dibatalkan. Sebanyak <strong className="text-foreground font-semibold">{selectedIds.length} toko</strong> yang Anda pilih akan dihapus secara permanen dari server.

                  </AlertDialogDescription>

                </AlertDialogHeader>

                <AlertDialogFooter>

                  <AlertDialogCancel>Batal</AlertDialogCancel>

                  <AlertDialogAction variant="destructive" onClick={handleBulkDelete}>

                    Hapus Sekaligus

                  </AlertDialogAction>

                </AlertDialogFooter>

              </AlertDialogContent>

            </AlertDialog>

          </div>

        </div>

      )}



      {/* ================= FITUR BARU: SHEET DETAIL TOKO ================= */}

      <Sheet open={isSheetOpenDetail} onOpenChange={setIsSheetOpenDetail}>

        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">

          <SheetHeader className="p-6 pb-4 border-b bg-muted/20">

            <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">

              <Info className="h-4 w-4" /> Detail Informasi

            </div>

            <SheetTitle className="text-xl font-bold mt-1 capitalize">{selectedStore?.name}</SheetTitle>

            <SheetDescription>Rincian konfigurasi toko / marketplace terpilih.</SheetDescription>

          </SheetHeader>



          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">

            {/* Detail Card Informasi */}

            <div className="space-y-4">

              <div className="flex justify-between items-center py-2.5 border-b border-dashed">

                <span className="text-sm text-muted-foreground">Platform</span>

                <Badge className={`

                  ${selectedStore?.platform === 'shopee' ? 'bg-orange-600 text-white' : ''}

                  ${selectedStore?.platform === 'lazada' ? 'bg-blue-600 text-white' : ''}

                  ${selectedStore?.platform === 'tiktok' ? 'bg-slate-600 text-white' : ''

                  }`

                }>

                  <span className="capitalize">{selectedStore?.platform}</span>

                </Badge>

              </div>



              <div className="flex justify-between items-center py-2.5 border-b border-dashed">

                <span className="text-sm text-muted-foreground flex items-center gap-1.5">

                  <Percent className="h-3.5 w-3.5" /> Biaya Admin

                </span>

                <span className="text-sm font-semibold text-foreground">

                  {formatPercent(selectedStore?.admin_fee)}

                </span>

              </div>



              <div className="flex justify-between items-center py-2.5 border-b border-dashed">

                <span className="text-sm text-muted-foreground flex items-center gap-1.5">

                  <Coins className="h-3.5 w-3.5" /> Biaya Proses Pesanan

                </span>

                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">

                  {new Intl.NumberFormat('id-ID', {

                    style: 'currency',

                    currency: 'IDR',

                    maximumFractionDigits: 0

                  }).format(selectedStore?.processing_fee ?? 0)}

                </Badge>

              </div>



              <div className="flex justify-between items-center py-2.5 border-b border-dashed">

                <span className="text-sm text-muted-foreground">Status Operasional</span>

                <Badge className={selectedStore?.active ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}>{selectedStore?.active ? 'Aktif' : 'Tidak Aktif'}</Badge>

              </div>



              <div className="flex justify-between items-start py-2.5 border-b border-dashed">

                <span className="text-sm text-muted-foreground flex items-center gap-1.5">

                  <Calendar className="h-3.5 w-3.5" /> Terdaftar Pada

                </span>

                <div className="text-right">

                  <p className="text-sm font-medium text-foreground">{formatDateTime(selectedStore?.created_at).dateStr}</p>

                  <p className="text-xs text-muted-foreground italic">Pukul {formatDateTime(selectedStore?.created_at).timeStr} WIB</p>

                </div>

              </div>



              {/* TAMBAHAN BARU: TANGGAL DIUBAH */}

              <div className="flex justify-between items-start py-2.5 border-b border-dashed">

                <span className="text-sm text-muted-foreground flex items-center gap-1.5">

                  <Calendar className="h-3.5 w-3.5" /> Terakhir Diubah

                </span>

                <div className="text-right">

                  <p className="text-sm font-medium text-foreground">{formatDateTime(selectedStore?.updated_at).dateStr}</p>

                  <p className="text-xs text-muted-foreground italic">Pukul {formatDateTime(selectedStore?.updated_at).timeStr} WIB</p>

                </div>

              </div>

              {/* ---------------------------------- */}



            </div>

          </div>



          <SheetFooter className="p-4 border-t bg-muted/10 mt-auto">

            <SheetClose asChild>

              <Button variant="outline" className="w-full">Tutup Detail</Button>

            </SheetClose>

          </SheetFooter>

        </SheetContent>

      </Sheet>



      {/* ================= SHEET EDIT TOKO ================= */}

      <Sheet

        open={isSheetOpenEdit}

        onOpenChange={(open) => {

          setIsSheetOpenEdit(open);

          if (!open) resetForm();

        }}

      >

        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">

          <SheetHeader className="p-6 pb-0">

            <SheetTitle>Edit Toko / Marketplace</SheetTitle>

            <SheetDescription>Ubah data Toko / Marketplace</SheetDescription>

          </SheetHeader>



          <Form

            key={selectedStore?.id}

            {...StoreController.update.form(selectedStore?.id ?? 0)}

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

                    <Label htmlFor="platform">Platform</Label>

                    <Select value={platform} onValueChange={setPlatform}>

                      <SelectTrigger id="platform" className='w-full'>

                        <SelectValue />

                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="shopee">Shopee</SelectItem>

                        <SelectItem value="lazada">Lazada</SelectItem>

                        <SelectItem value="tiktok">Tiktok</SelectItem>

                      </SelectContent>

                    </Select>

                    <input type="hidden" name="platform" value={platform} />

                    <InputError message={errors.platform} />

                  </div>



                  <div className="grid gap-3">

                    <Label htmlFor="name">Nama Toko / Marketplace</Label>

                    <Input

                      id="name"

                      name="name"

                      defaultValue={selectedStore?.name || ''}

                      required

                      placeholder="Contoh: Tokopedia, Bukalapak, Shopee, dll."

                    />

                    <InputError message={errors.name} />

                  </div>



                  <div className="grid gap-3">

                    <Label htmlFor="admin_fee">Biaya Admin (%)</Label>

                    <Input

                      id="admin_fee"

                      name="admin_fee"

                      defaultValue={selectedStore?.admin_fee ? Number(selectedStore.admin_fee) : ''}

                      required

                      placeholder="Contoh: 5"

                    />

                    <InputError message={errors.admin_fee} />

                  </div>



                  <div className="grid gap-3">

                    <Label htmlFor="processing_fee">Biaya Proses Pesanan (Rp)</Label>

                    <input type="hidden" name="processing_fee" value={rawPrice} required />

                    <Input

                      id="processing_fee"

                      type="text"

                      value={displayPrice}

                      onChange={handlePriceChange}

                      placeholder="Contoh: 1250"

                    />

                    <InputError message={errors.processing_fee} />

                  </div>



                  <div className="flex items-center justify-between rounded-lg border p-4 bg-card">

                    <div className="space-y-0.5">

                      <Label htmlFor="active" className="text-base">Status Toko</Label>

                      <p className="text-xs text-muted-foreground">

                        {isActive ? 'Toko aktif dan dapat menerima pesanan' : 'Toko nonaktif sementara'}

                      </p>

                    </div>

                    <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />

                    <input type="hidden" name="active" value={isActive ? '1' : '0'} />

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



Store.layout = {

  breadcrumbs: [

    { title: 'Master Data', href: '#' },

    { title: 'Toko / Marketplace', href: StoreController.index() },

  ],

};
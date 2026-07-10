/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link, router } from '@inertiajs/react';
import { FileSpreadsheet, MoreHorizontalIcon, Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
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

export default function Category({ categories, filters }: any) {
  // State Kontrol Sheet (Tambah, Edit, Detail)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);
  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false);

  // State Pencarian, Pilihan Checkbox, & Data Categori Terpilih
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

  // State Form fields
  const [isActive, setIsActive] = useState(true);

  // Reset pilihan saat data stores berubah
  useEffect(() => {
    setSelectedIds([]);
  }, [categories]);

  // Effect untuk server-side search & filtering dengan debounce 300ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get(
        CategoryController.index(),
        {
          search: search,
          status: statusFilter
        },
        { preserveState: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = categories.data.map((category: any) => category.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, categoryId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    router.post('/master-data/category/bulk-delete', {
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
    window.location.href = `/master-data/category/export?ids=${idsQuery}`;
  };

  // Fungsi untuk mereset form saat Sheet ditutup
  const resetForm = () => {
    setSelectedCategory(null);
    setIsActive(true);
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

  return (
    <>
      <Head title="Kelola Kategori" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Bungkus Heading dan Button dalam flex container agar sejajar */}
        <div className="flex items-center justify-between">
          <Heading
            title="Kelola Kategori"
            description="Kelola kategori produk"
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
                  Tambah Kategori
                </Button>
              </SheetTrigger>

              <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
                <SheetHeader className="p-6 pb-0">
                  <SheetTitle>Tambah Kategori Produk</SheetTitle>
                  <SheetDescription>
                    Masukan data kategori produk
                  </SheetDescription>
                </SheetHeader>

                {/* Form membungkus bodi input dan footer sekaligus */}
                <Form
                  key={`add-category-form-${formKey}`}
                  {...CategoryController.store.form()}
                  options={{
                    preserveScroll: true,
                  }}
                  onSuccess={() => {
                    if (submitAction === 'save') {
                      // Jika tombol biasa: tutup sheet dan reset
                      setIsSheetOpen(false);
                      resetForm();
                    } else {
                      // Jika tombol "Tambah Lagi": jangan tutup sheet, cukup reset harga & pasang key baru biar input kosong
                      resetForm();
                      setFormKey((prev) => prev + 1);
                    }
                  }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  {({ processing, errors }) => (
                    <>
                      {/* Bagian isi form dengan style grid presisi sesuai keinginan Anda */}
                      <div className="grid flex-1 auto-rows-min gap-6 px-6 py-4 overflow-y-auto no-scrollbar">

                        {/* Input Nama Kategori */}
                        <div className="grid gap-3">
                          <Label htmlFor="name">Nama Kategori</Label>
                          <Input
                            id="name"
                            name="name"
                            required
                            placeholder="Contoh: Elektronik"
                          />
                          <InputError message={errors.name} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                          <div className="space-y-0.5">
                            <Label htmlFor="active" className="text-base">Status Kategori</Label>
                            <p className="text-xs text-muted-foreground">
                              {isActive ? 'Kategori aktif dan dapat digunakan' : 'Kategori nonaktif sementara'}
                            </p>
                          </div>
                          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                          <input type="hidden" name="active" value={isActive ? '1' : '0'} />
                        </div>
                      </div>

                      {/* Tombol aksi sekarang berada rapi di dalam SheetFooter */}
                      <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                        {/* Tombol 1: Simpan Biasa */}
                        <Button
                          type="submit"
                          variant="secondary"
                          disabled={processing}
                          onClick={() => setSubmitAction('save')}
                        >
                          {processing && submitAction === 'save' ? 'Menyimpan...' : 'Simpan Kategori'}
                        </Button>
                        {/* Tombol 2: Simpan & Tambah Lagi */}
                        <Button
                          type="submit" // Pastikan ada type="submit"
                          disabled={processing}
                          onClick={() => setSubmitAction('save_and_add')}
                        >
                          {processing && submitAction === 'save_and_add' ? 'Menyimpan...' : 'Simpan & Tambah'}
                        </Button>
                        <SheetClose asChild>
                          <Button variant="outline" type="button" disabled={processing}>
                            Batal
                          </Button>
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
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filter Dropdown Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
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

          {/* Kotak Input Pencarian dipindah ke kanan sebaris dengan filter dropdown */}
          <div className="relative w-full sm:w-80 lg:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              type="search"
              placeholder="Cari nama kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80"
            />
          </div>
        </div>

        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 md:min-h-min shadow-sm">
          <div className="p-0">
            <Table>
              <TableCaption className='py-6 text-zinc-400 dark:text-zinc-500'>Daftar seluruh kategori yang tersimpan di sistem.</TableCaption>
              <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={categories.data.length > 0 && selectedIds.length === categories.data.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">Nama Kategori</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 3. Mapping data categories dari database */}
                {categories.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Tags />
                          </EmptyMedia>
                          <EmptyTitle>Belum ada data</EmptyTitle>
                          <EmptyDescription>Tidak ada data yang ditemukan.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.data.map((category: any, index: number) => {
                    const isSelected = selectedIds.includes(category.id);
                    return (
                      <TableRow key={category.id}
                        className={`cursor-pointer transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800/60 ${isSelected ? 'bg-zinc-50/60 dark:bg-zinc-800/40' : ''}`}
                        // FITUR: Klik baris untuk buka Detail Info Sheet
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsSheetOpenDetail(true);
                        }}
                      >
                        {/* Checkbox Cell - StopPropagation agar tidak memicu detil Sheet */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(category.id, !!checked)}
                            aria-label={`Select ${category.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm text-foreground">
                              {formatDateTime(category.created_at).dateStr}
                            </span>
                            <span className="text-xs text-muted-foreground italic">
                              Pukul {formatDateTime(category.created_at).timeStr} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <Badge className={category.active ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}>{category.active ? 'Aktif' : 'Tidak Aktif'}</Badge>
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
                                    setSelectedCategory(category);
                                    setIsActive(!!category.active);
                                    setIsSheetOpenEdit(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {/* Jadikan AlertDialogTrigger sebagai pembungkus Item */}
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Konten Pop-up Konfirmasi */}
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus secara permanen dari server.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <Link href={CategoryController.destroy(category.id)}>
                                  <AlertDialogAction variant="destructive">
                                    Hapus
                                  </AlertDialogAction>
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

            {categories.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                  Menampilkan {categories.from ?? 0} sampai {categories.to ?? 0} dari {categories.total ?? 0} kategori
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    disabled={!categories.prev_page_url}
                    onClick={() => categories.prev_page_url && router.get(categories.prev_page_url, {}, { preserveState: true })}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 px-1">
                    Hal {categories.current_page} dari {categories.last_page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    disabled={!categories.next_page_url}
                    onClick={() => categories.next_page_url && router.get(categories.next_page_url, {}, { preserveState: true })}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            <strong className="text-zinc-900 dark:text-zinc-50 font-bold">{selectedIds.length}</strong> kategori terpilih
          </span>
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="rounded-full text-xs h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Batal
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              className="rounded-full gap-1.5 text-xs h-8 border-emerald-600/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white dark:border-emerald-900/30 dark:text-emerald-400 dark:bg-emerald-950/20 dark:hover:bg-emerald-600"
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
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-zinc-500">
                    Tindakan ini tidak dapat dibatalkan. Sebanyak <strong className="text-zinc-950 dark:text-zinc-50 font-bold">{selectedIds.length} kategori</strong> yang Anda pilih akan dihapus secara permanen dari server.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl text-xs">Batal</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" className="rounded-xl text-xs" onClick={handleBulkDelete}>
                    Hapus Sekaligus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* ================= SHEET DETAIL KATEGORI ================= */}
      <Sheet open={isSheetOpenDetail} onOpenChange={setIsSheetOpenDetail}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Detail Informasi Kategori</SheetTitle>
            <SheetDescription>
              Berikut adalah rincian lengkap dari kategori yang Anda pilih.
            </SheetDescription>
          </SheetHeader>

          {/* Konten Detail */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {selectedCategory && (
              <>
                {/* 1. Visual Identifier Kategori (Pengganti Gambar) */}
                <div className="flex flex-col items-center justify-center border rounded-xl p-6 bg-muted/30 dark:bg-muted/10 gap-2">
                  <div className="w-14 h-14 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center border border-sky-100 dark:border-sky-900 text-sky-600 dark:text-sky-400">
                    {/* Kamu bisa pakai icon Folder, Layers, atau Box dari lucide-react */}
                    <Tags className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">ID Kategori: #{selectedCategory.id}</span>
                </div>

                {/* 2. Informasi Utama */}
                <div className="space-y-4">
                  {/* Nama Kategori */}
                  <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama Kategori</span>
                    <span className="text-base font-semibold text-foreground leading-relaxed">{selectedCategory.name}</span>
                  </div>

                  {/* Status Kategori */}
                  <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status di Sistem</span>
                    <div>
                      <Badge className={`mt-0.5 ${selectedCategory.active ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                        {selectedCategory.active ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                  </div>

                  {/* Riwayat Waktu (Created & Updated) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Waktu Ditambahkan</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatDateTime(selectedCategory.created_at).dateStr}
                      </span>
                      <span className="text-[11px] text-muted-foreground italic">
                        Pukul {formatDateTime(selectedCategory.created_at).timeStr} WIB
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Terakhir Diperbarui</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatDateTime(selectedCategory.updated_at).dateStr}
                      </span>
                      <span className="text-[11px] text-muted-foreground italic">
                        Pukul {formatDateTime(selectedCategory.updated_at).timeStr} WIB
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Tutup */}
          <SheetFooter className="p-6 border-t bg-background mt-auto">
            <SheetClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">Tutup Detail</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ================= SHEET EDIT CATEGORY ================= */}
      <Sheet
        open={isSheetOpenEdit}
        onOpenChange={(open) => {
          setIsSheetOpenEdit(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Edit Kategori</SheetTitle>
            <SheetDescription>
              Ubah data kategori
            </SheetDescription>
          </SheetHeader>

          {/* Form membungkus bodi input dan footer sekaligus */}
          <Form
            key={selectedCategory?.id}
            {...CategoryController.update.form(selectedCategory?.id ?? 0)}
            options={{
              preserveScroll: true,
            }}
            onSuccess={() => {
              setIsSheetOpenEdit(false);
              resetForm();
            }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {({ processing, errors }) => (
              <>
                {/* Bagian isi form dengan style grid presisi sesuai keinginan Anda */}
                <div className="grid flex-1 auto-rows-min gap-6 px-6 py-4 overflow-y-auto no-scrollbar">

                  {/* Input Nama Kategori */}
                  <div className="grid gap-3">
                    <Label htmlFor="name">Nama Kategori</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedCategory?.name || ''}
                      required
                      placeholder="Contoh: Elektronik"
                    />
                    <InputError message={errors.name} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="active" className="text-base">Status Kategori</Label>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? 'Kategori aktif dan dapat digunakan' : 'Kategori nonaktif sementara'}
                      </p>
                    </div>
                    <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                    <input type="hidden" name="active" value={isActive ? '1' : '0'} />
                  </div>
                </div>

                {/* Tombol aksi sekarang berada rapi di dalam SheetFooter */}
                <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" type="button" disabled={processing}>
                      Batal
                    </Button>
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

Category.layout = {
  breadcrumbs: [
    { title: 'Master Data', href: '#' },
    { title: 'Toko / Marketplace', href: CategoryController.index() },
  ],
};

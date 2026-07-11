/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link, router } from '@inertiajs/react';
import { Box, FileSpreadsheet, MoreHorizontalIcon, PencilIcon, Plus, Search, Trash2, Trash2Icon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function ProductTableSkeleton() {
  return (
    <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 md:min-h-min shadow-sm animate-pulse">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
            <TableRow>
              <TableHead className="w-[50px]"><div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" /></TableHead>
              <TableHead className="text-xs">Gambar</TableHead>
              <TableHead className="text-xs">Tanggal</TableHead>
              <TableHead className="text-xs">SKU</TableHead>
              <TableHead className="text-xs">Nama Produk</TableHead>
              <TableHead className="text-xs">Kategori</TableHead>
              <TableHead className="text-xs">Stok</TableHead>
              <TableHead className="text-xs">Harga Jual</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800/60">
                <TableCell><div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" /></TableCell>
                <TableCell><div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-10" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20" /></TableCell>
                <TableCell><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-12" /></TableCell>
                <TableCell className="text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Product({ products, categoriesList, filters }: any) {
  // State Kontrol Sheet (Tambah, Edit, Detail, skeleton)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);
  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false); // State baru untuk Detail

  // State untuk menyimpan URL preview gambar sementara
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // State Pencarian, Pilihan Checkbox, & Data Produk Terpilih
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  // -------------------------------

  // ---- STATE BARU: FILTER CATEGORY & STATUS ----
  const [categoryFilter, setCategoryFilter] = useState(filters?.category || 'all');
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
  // -----------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  // State Form fields
  const [rawPrice, setRawPrice] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reset pilihan saat data products berubah
  useEffect(() => {
    setSelectedIds([]);

    if (selectedProduct) {
      // Isi state dengan category_id milik produk yang dipilih (ubah ke string)
      setCategoryId(selectedProduct.category_id?.toString() || '');
      setIsActive(selectedProduct.active === 1 || selectedProduct.active === true);
    } else {
      setCategoryId('');
    }
  }, [products, selectedProduct]);

  const isMounted = useRef(false);
  // Effect untuk server-side search & filtering dengan debounce 300ms
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      router.get(
        ProductController.index(),
        {
          search: search,
          category: categoryFilter,
          status: statusFilter
        },
        { preserveState: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, categoryFilter, statusFilter]);

  // Handler saat user memilih file gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi opsional: pastikan file adalah gambar
      if (!file.type.startsWith('image/')) {
        alert('File yang dipilih harus berupa gambar!');
        return;
      }
      // Buat URL sementara untuk preview
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  // Handler saat user memilih file gambar baru di form edit
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File yang dipilih harus berupa gambar!');
        return;
      }
      setEditImagePreview(URL.createObjectURL(file));
    } else {
      setEditImagePreview(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = products.data.map((store: any) => store.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, productId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    router.post('/master-data/product/bulk-delete', {
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
    window.location.href = `/master-data/product/export?ids=${idsQuery}`;
  };

  // Fungsi untuk mereset form saat Sheet ditutup
  const resetForm = () => {
    setRawPrice('');
    setDisplayPrice('');
    setSelectedProduct(null);
    setImagePreview(null);
    setEditImagePreview(null);
    setCategoryId('');
    setIsActive(true);
  };

  // Fungsi untuk memformat input secara real-time
  const handlePriceChange = (e: any) => {
    // 1. Hapus semua karakter yang bukan angka (huruf, titik, koma, dll)
    const numericValue = e.target.value.replace(/\D/g, '');

    // 2. Simpan angka asli ke state rawPrice
    setRawPrice(numericValue);

    // 3. Format angka dengan titik (standar id-ID) untuk tampilan
    if (numericValue) {
      setDisplayPrice(new Intl.NumberFormat('id-ID').format(numericValue));
    } else {
      setDisplayPrice('');
    }
  };

  // Fungsi tampil tanggal dan waktu
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
      <Head title="Master Produk" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Bungkus Heading dan Button dalam flex container agar sejajar */}
        <div className="flex items-center justify-between">
          <Heading
            title="Master Produk"
            description="Kelola data produk untuk semua toko online Anda"
          />
          {/* Tombol Tambah Produk */}
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
                  Tambah Produk
                </Button>
              </SheetTrigger>

              <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
                <SheetHeader className="p-6 pb-0">
                  <SheetTitle>Tambah Produk</SheetTitle>
                  <SheetDescription>
                    Masukkan detail produk baru ke dalam sistem. Klik simpan jika sudah selesai.
                  </SheetDescription>
                </SheetHeader>

                {/* Form membungkus bodi input dan footer sekaligus */}
                <Form
                  key={`add-product-form-${formKey}`}
                  {...ProductController.store.form()}
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
                      {/* Bagian isi form dengan style grid presisi sesuai keinginan Anda */}
                      <div className="grid flex-1 auto-rows-min gap-6 px-6 py-4 overflow-y-auto no-scrollbar">

                        {/* Input Gambar dengan Live Preview */}
                        <div className="grid gap-3">
                          <Label htmlFor="image">Gambar Produk</Label>

                          <div className="flex flex-col items-center gap-4 p-4 border border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors relative group">
                            {imagePreview ? (
                              // Tampilan jika GAMBAR SUDAH DIPILIH
                              <div className="relative w-full max-w-[180px] aspect-square rounded-md overflow-hidden border bg-background flex items-center justify-center">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                {/* Tombol Hapus Preview */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null);
                                    // Reset nilai input file bawaan agar sinkron
                                    const fileInput = document.getElementById('image') as HTMLInputElement;
                                    if (fileInput) fileInput.value = '';
                                  }}
                                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full shadow-md hover:bg-destructive/90 transition-colors"
                                  title="Hapus gambar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              // Tampilan awal / Placeholder JIKA BELUM ADA GAMBAR
                              <label
                                htmlFor="image"
                                className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4 w-full"
                              >
                                <div className="p-3 bg-background border rounded-full shadow-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                  <Box className="h-5 w-5 text-muted-foreground/60" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium">Klik untuk upload gambar</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    PNG, JPG, JPEG, atau WEBP (Maks. 2MB)
                                  </p>
                                </div>
                              </label>
                            )}

                            {/* Input File asli disembunyikan secara visual, tapi dihubungkan lewat atribut 'htmlFor' pada label */}
                            <Input
                              id="image"
                              type="file"
                              name="image"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </div>

                          <InputError message={errors.image} />
                        </div>

                        {/* Input SKU */}
                        <div className="grid gap-3">
                          <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                          <Input
                            id="sku"
                            name="sku"
                            required
                            placeholder="Contoh: MEOW-FOOD-01"
                          />
                          <InputError message={errors.sku} />
                        </div>

                        {/* Input Nama Produk */}
                        <div className="grid gap-3">
                          <Label htmlFor="name">Nama Produk</Label>
                          <Input
                            id="name"
                            name="name"
                            required
                            placeholder="Contoh: Makanan Kucing Premium 1kg"
                          />
                          <InputError message={errors.name} />
                        </div>

                        {/* Select Input Kategori */}
                        <div className="grid gap-3">
                          <Label htmlFor="category_id">Kategori Produk</Label>
                          <Select
                            value={categoryId}
                            onValueChange={setCategoryId}
                          >
                            <SelectTrigger id="category_id" className="w-full bg-background">
                              <SelectValue placeholder="-- Pilih Kategori --" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriesList && categoriesList.length > 0 ? (
                                categoriesList
                                  .filter((cat: any) => cat.active) // Bagus secara UX: Hanya tampilkan kategori yang aktif saja
                                  .map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                      {cat.name}
                                    </SelectItem>
                                  ))
                              ) : (
                                <div className="text-xs text-muted-foreground p-2 text-center italic">
                                  Belum ada kategori yang tersedia
                                </div>
                              )}
                            </SelectContent>
                          </Select>

                          {/* Hidden input agar nilainya otomatis ikut ter-submit oleh pembungkus <Form> */}
                          <input type="hidden" name="category_id" value={categoryId} />
                          <InputError message={errors.category_id} />
                        </div>

                        {/* Grid Berdampingan untuk Stok & Harga */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Input Jumlah Stok */}
                          <div className="grid gap-3">
                            <Label htmlFor="stock">Jumlah Stok</Label>
                            <Input
                              id="stock"
                              type="number"
                              name="stock"
                              required
                              min="0"
                              placeholder="0"
                            />
                            <InputError message={errors.stock} />
                          </div>

                          {/* Input Harga */}
                          <div className="grid gap-3">
                            <Label htmlFor="price">Harga Jual (Rp)</Label>
                            <input type="hidden" name="price" value={rawPrice} required />
                            <Input
                              id="price"
                              type="text"
                              value={displayPrice}
                              onChange={handlePriceChange}
                              placeholder="50.000"
                            />
                            <InputError message={errors.price} />
                          </div>
                        </div>

                        {/* Input Deskripsi */}
                        <div className="grid gap-3">
                          <Label htmlFor="description">Deskripsi Produk</Label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Masukkan deskripsi lengkap spesifikasi produk..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <InputError message={errors.description} />
                        </div>

                        {/* Switch Status */}
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                          <div className="space-y-0.5">
                            <Label htmlFor="active" className="text-base">Status Produk</Label>
                            <p className="text-xs text-muted-foreground">
                              {isActive ? 'Produk aktif dan dapat dijual' : 'Produk nonaktif sementara'}
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
                          {processing && submitAction === 'save' ? 'Menyimpan...' : 'Simpan Produk'}
                        </Button>
                        {/* Tombol 2: Simpan & Tambah Lagi */}
                        <Button
                          type="submit" // Pastikan ada type="submit"
                          disabled={processing}
                          onClick={() => setSubmitAction('save_and_add')}
                        >
                          {processing && submitAction === 'save_and_add' ? 'Menyimpan...' : 'Simpan & Tambah Lagi'}
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
        {/* BARIS SEKSI FILTER UTAMA */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filter Dropdown Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Kategori</SelectItem>

                {/* Loop data kategori dari backend */}
                {categoriesList && categoriesList.length > 0 ? (
                  categoriesList.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Tidak ada kategori
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

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

            {(search !== '' || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
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
              placeholder="Cari nama produk, SKU, atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80"
            />
          </div>
        </div>

        {/* TABLE */}
        {isLoading ? (
          <ProductTableSkeleton />
        ) : (
          <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 md:min-h-min shadow-sm">
          <div className="p-0">
            <Table>
              <TableCaption className='py-6 text-zinc-400 dark:text-zinc-500'>Daftar seluruh produk yang tersimpan di sistem.</TableCaption>
              <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={products.data.length > 0 && selectedIds.length === products.data.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-xs">Gambar</TableHead>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">SKU</TableHead>
                  <TableHead className="text-xs">Nama Produk</TableHead>
                  <TableHead className="text-xs">Kategori</TableHead>
                  <TableHead className="text-xs">Stok</TableHead>
                  <TableHead className="text-xs">Harga Jual</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 3. Mapping data products dari database */}
                {products.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Box />
                          </EmptyMedia>
                          <EmptyTitle>Belum ada data</EmptyTitle>
                          <EmptyDescription>Tidak ada data yang ditemukan.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.data.map((product: any, index: any) => {
                    const isSelected = selectedIds.includes(product.id);
                    return (
                      <TableRow key={product.id}
                        className={`cursor-pointer transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800/60 ${isSelected ? 'bg-zinc-50/60 dark:bg-zinc-800/40' : ''}`}
                        // FITUR: Klik baris untuk buka Detail Info Sheet
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsSheetOpenDetail(true);
                        }}
                      >
                        {/* Checkbox Cell - StopPropagation agar tidak memicu detil Sheet */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(product.id, !!checked)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        {/* CELL GAMBAR PRODUK - LIVE DARI DATABASE */}
                        <TableCell>
                          {product.image ? (
                            /* openDelay={0} dan closeDelay={0} membuat popup langsung muncul instan saat di-hover tanpa nunggu */
                            <HoverCard openDelay={0} closeDelay={0}>

                              {/* TRIGGER: Gambar Kecil yang ada di Tabel */}
                              <HoverCardTrigger asChild>
                                <div className="w-12 h-12 rounded-sm overflow-hidden border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </HoverCardTrigger>

                              {/* CONTENT: Popup Gambar Besar (Aman dari Overflow Tabel karena pakai Portal) */}
                              <HoverCardContent
                                side="right"       /* Pilihan posisi: "right", "left", "top", "bottom" */
                                align="center"     /* Biar posisinya tegak lurus di tengah */
                                sideOffset={12}    /* Jarak jarak popup dari gambar kecil (dalam pixel) */
                                className="w-48 p-1.5 bg-background border shadow-xl rounded-lg pointer-events-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                              >
                                <div className="w-full aspect-square overflow-hidden rounded-sm">
                                  <img
                                    src={product.image}
                                    alt="Preview Besar"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </HoverCardContent>

                            </HoverCard>
                          ) : (
                            /* Placeholder jika tidak ada gambar */
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border text-muted-foreground/60">
                              <Box className="h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm text-foreground">
                              {formatDateTime(product.created_at).dateStr}
                            </span>
                            <span className="text-xs text-muted-foreground italic">
                              Pukul {formatDateTime(product.created_at).timeStr} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.sku}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                            {product.category?.name || 'Tanpa Kategori'}
                          </Badge>
                        </TableCell>
                        {/* TAMPILAN BAGUSNYA: CELL STOK QUICK INLINE UPDATE */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <InlineStockUpdater product={product} />
                        </TableCell>
                        {/* Format angka ke dalam mata uang Rupiah */}
                        <TableCell>
                          <span className='font-bold text-green-600'>
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0
                            }).format(product.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={product.active ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}>{product.active ? 'Aktif' : 'Tidak Aktif'}</Badge>
                        </TableCell>
                        {/* Action Cell - StopPropagation agar tidak memicu detil Sheet */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {/* Bungkus Dropdown di dalam AlertDialog */}
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
                                    setSelectedProduct(product);
                                    setIsActive(!!product.active);
                                    setEditImagePreview(null);
                                    setCategoryId(product.category_id);
                                    setRawPrice(product.price.toString());
                                    setDisplayPrice(new Intl.NumberFormat('id-ID').format(product.price));
                                    setIsSheetOpenEdit(true);
                                  }}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {/* Jadikan AlertDialogTrigger sebagai pembungkus Item */}
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem variant="destructive">
                                    <Trash2Icon className="h-4 w-4" />
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
                                  Tindakan ini tidak dapat dibatalkan. Produk akan dihapus secara permanen dari server.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <Link href={ProductController.destroy(product.id)}>
                                  <AlertDialogAction variant="destructive">
                                    Hapus
                                  </AlertDialogAction>
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

            {products.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                  Menampilkan {products.from ?? 0} sampai {products.to ?? 0} dari {products.total ?? 0} produk
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    disabled={!products.prev_page_url}
                    onClick={() => products.prev_page_url && router.get(products.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 px-1">
                    Hal {products.current_page} dari {products.last_page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    disabled={!products.next_page_url}
                    onClick={() => products.next_page_url && router.get(products.next_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* ================= KOTAK MELAYANG (FLOATING ACTION BAR) ================= */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            <strong className="text-zinc-900 dark:text-zinc-50 font-bold">{selectedIds.length}</strong> produk terpilih
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
                    Tindakan ini tidak dapat dibatalkan. Sebanyak <strong className="text-zinc-950 dark:text-zinc-50 font-bold">{selectedIds.length} produk</strong> yang Anda pilih akan dihapus secara permanen dari server.
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

      {/* ================= SHEET DETAIL PRODUK ================= */}
      <Sheet
        open={isSheetOpenDetail}
        onOpenChange={(open) => {
          setIsSheetOpenDetail(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Detail Informasi Produk</SheetTitle>
            <SheetDescription>
              Berikut adalah rincian lengkap dari produk yang Anda pilih.
            </SheetDescription>
          </SheetHeader>

          {/* Konten Detail */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {selectedProduct && (
              <>
                {/* 1. Area Gambar Besar */}
                <div className="flex flex-col items-center justify-center border rounded-xl p-4 bg-muted/30 dark:bg-muted/10">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-44 h-44 object-cover rounded-lg border shadow-sm bg-background"
                    />
                  ) : (
                    <div className="w-44 h-44 rounded-lg bg-muted flex items-center justify-center border text-muted-foreground/40">
                      <Box className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* 2. Informasi Utama Produk */}
                <div className="space-y-4">
                  {/* SKU */}
                  <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">SKU (Stock Keeping Unit)</span>
                    <span className="text-sm font-mono font-medium text-foreground">{selectedProduct.sku || '-'}</span>
                  </div>

                  {/* Nama Produk */}
                  <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nama Produk</span>
                    <span className="text-base font-semibold text-foreground leading-relaxed">{selectedProduct.name}</span>
                  </div>

                  {/* Grid Harga & Stok */}
                  <div className="grid grid-cols-2 gap-4 border-b pb-3 dark:border-sidebar-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Harga Jual</span>
                      <span className="text-lg font-extrabold text-green-600 dark:text-green-500">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0
                        }).format(selectedProduct.price)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sisa Stok</span>
                      <div>
                        <Badge variant="outline" className="text-sm font-semibold px-2.5 py-0.5 mt-0.5">
                          {selectedProduct.stock} unit
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Grid Status & Kategori */}
                  <div className="grid grid-cols-2 gap-4 border-b pb-3 dark:border-sidebar-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status di Sistem</span>
                      <div>
                        <Badge className={`mt-0.5 ${selectedProduct.active ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
                          {selectedProduct.active ? 'Aktif Dijual' : 'Non-Aktif'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Kategori</span>
                      <div>
                        <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 mt-0.5">
                          {selectedProduct.category?.name || 'Tanpa Kategori'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi Produk */}
                  <div className="flex flex-col gap-1 border-b pb-3 dark:border-sidebar-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Deskripsi Produk</span>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {selectedProduct.description || (
                        <span className="text-muted-foreground italic text-xs">Tidak ada deskripsi untuk produk ini.</span>
                      )}
                    </p>
                  </div>

                  {/* Grid Waktu (Created & Updated) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Waktu Ditambahkan</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatDateTime(selectedProduct.created_at).dateStr}
                      </span>
                      <span className="text-[11px] text-muted-foreground italic">
                        Pukul {formatDateTime(selectedProduct.created_at).timeStr} WIB
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Terakhir Diperbarui</span>
                      <span className="text-xs font-medium text-foreground">
                        {formatDateTime(selectedProduct.updated_at).dateStr}
                      </span>
                      <span className="text-[11px] text-muted-foreground italic">
                        Pukul {formatDateTime(selectedProduct.updated_at).timeStr} WIB
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

      {/* ================= SHEET EDIT PRODUK ================= */}
      <Sheet
        open={isSheetOpenEdit}
        onOpenChange={(open) => {
          setIsSheetOpenEdit(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Edit Produk</SheetTitle>
            <SheetDescription>
              Ubah informasi produk di bawah ini.
            </SheetDescription>
          </SheetHeader>

          {/* Form membungkus bodi input dan footer sekaligus */}
          <Form
            key={selectedProduct?.id}
            {...ProductController.update.form(selectedProduct?.id ?? 0)}
            options={{ preserveScroll: true }}
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

                  {/* Input & Preview Gambar Edit ala Area Dropzone */}
                  <div className="grid gap-3">
                    <Label htmlFor="image_edit">Gambar Produk</Label>

                    <div className="flex flex-col items-center gap-4 p-4 border border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors relative group">
                      {editImagePreview || selectedProduct?.image ? (
                        // KUNCI PERBAIKAN: Menggunakan <label> dan cursor-pointer agar bisa diklik untuk ganti gambar
                        <label
                          htmlFor="image_edit"
                          className="relative w-full max-w-[180px] aspect-square rounded-md overflow-hidden border bg-background flex items-center justify-center cursor-pointer group/preview"
                        >
                          <img
                            src={editImagePreview || selectedProduct.image}
                            alt="Preview Edit"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover/preview:scale-105"
                          />

                          {/* Efek Keren: Overlay gelap & teks yang muncul saat kursor diarahkan ke gambar */}
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200">
                            <Plus className="h-6 w-6 text-white" />
                            <span className="text-white text-xs font-medium">Ganti Gambar</span>
                          </div>

                          {/* Badge penanda status gambar */}
                          <span className="absolute bottom-2 left-2 bg-background/90 text-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm z-10">
                            {editImagePreview ? "Gambar Baru" : "Gambar Saat Ini"}
                          </span>

                          {/* Tombol sampah muncul HANYA jika user sedang memilih file baru (untuk membatalkan dan kembali ke gambar semula) */}
                          {editImagePreview && (
                            <button
                              type="button"
                              onClick={(e) => {
                                // KUNCI PERBAIKAN: Hentikan event agar tidak memicu click pada label (biar file manager gak kebuka lagi)
                                e.preventDefault();
                                e.stopPropagation();

                                setEditImagePreview(null);
                                // Reset nilai input file bawaan agar kembali sinkron
                                const fileInput = document.getElementById('image_edit') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full shadow-md hover:bg-destructive/90 transition-colors z-20"
                              title="Kembali ke gambar semula"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </label>
                      ) : (
                        // Tampilan placeholder JIKA sedari awal produk memang tidak punya gambar
                        <label
                          htmlFor="image_edit"
                          className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4 w-full"
                        >
                          <div className="p-3 bg-background border rounded-full shadow-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            <Box className="h-5 w-5 text-muted-foreground/60" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Klik untuk upload gambar</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              PNG, JPG, JPEG, atau WEBP (Maks. 2MB)
                            </p>
                          </div>
                        </label>
                      )}

                      {/* Input File asli disembunyikan */}
                      <Input
                        id="image_edit"
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                    </div>

                    <InputError message={errors.image} />
                  </div>

                  {/* Input SKU */}
                  <div className="grid gap-3">
                    <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                    <Input
                      id="sku"
                      name="sku"
                      defaultValue={selectedProduct?.sku || ''}
                      required
                      placeholder="Contoh: MEOW-FOOD-01"
                    />
                    <InputError message={errors.sku} />
                  </div>

                  {/* Input Nama Produk */}
                  <div className="grid gap-3">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedProduct?.name || ''}
                      required
                      placeholder="Contoh: Makanan Kucing Premium 1kg"
                    />
                    <InputError message={errors.name} />
                  </div>

                  {/* Select Input Kategori */}
                  <div className="grid gap-3">
                    <Label htmlFor="category_id">Kategori Produk</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category_id" className="w-full bg-background">
                        <SelectValue placeholder="-- Pilih Kategori --" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList && categoriesList.length > 0 ? (
                          categoriesList
                            .filter((cat: any) => cat.active) // Bagus secara UX: Hanya tampilkan kategori yang aktif saja
                            .map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="text-xs text-muted-foreground p-2 text-center italic">
                            Belum ada kategori yang tersedia
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Hidden input agar nilainya otomatis ikut ter-submit oleh pembungkus <Form> */}
                    <input type="hidden" name="category_id" value={categoryId} />
                    <InputError message={errors.category_id} />
                  </div>

                  {/* Grid Berdampingan untuk Stok & Harga */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Input Jumlah Stok */}
                    <div className="grid gap-3">
                      <Label htmlFor="stock">Jumlah Stok</Label>
                      <Input
                        id="stock"
                        type="number"
                        name="stock"
                        defaultValue={selectedProduct?.stock || 0}
                        required
                        min="0"
                        placeholder="0"
                      />
                      <InputError message={errors.stock} />
                    </div>

                    {/* Input Harga */}
                    <div className="grid gap-3">
                      <Label htmlFor="price">Harga Jual (Rp)</Label>
                      <input type="hidden" name="price" value={rawPrice} required />
                      <Input
                        id="price"
                        type="text"
                        value={displayPrice}
                        onChange={handlePriceChange}
                        placeholder="50.000"
                      />
                      <InputError message={errors.price} />
                    </div>
                  </div>

                  {/* Input Deskripsi Edit */}
                  <div className="grid gap-3">
                    <Label htmlFor="description_edit">Deskripsi Produk</Label>
                    <textarea
                      id="description_edit"
                      name="description"
                      defaultValue={selectedProduct?.description || ''}
                      rows={3}
                      placeholder="Masukkan deskripsi lengkap spesifikasi produk..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <InputError message={errors.description} />
                  </div>

                  {/* Switch Status Edit */}
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label htmlFor="active" className="text-base">Status Produk</Label>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? 'Produk aktif dan dapat dijual' : 'Produk nonaktif sementara'}
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

Product.layout = {
  breadcrumbs: [
    { title: 'Stok & Pemasukan', href: '#' },
    { title: 'Master Produk', href: ProductController.index() },
  ],
};

function InlineStockUpdater({ product }: { product: any }) {
  const [open, setOpen] = useState(false);
  const [stockVal, setStockVal] = useState(product.stock?.toString() || '0');
  const [loading, setLoading] = useState(false);

  // Mengamankan value input agar sinkron jika data dari database berubah
  useEffect(() => {
    setStockVal(product.stock?.toString() || '0');
  }, [product.stock]);

  // Fungsi submit update stok saja
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    router.put(`/master-data/product/${product.id}/update-stock`, {
      stock: parseInt(stockVal) || 0
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
      onFinish: () => setLoading(false)
    });
  };

  // Kondisi untuk menentukan apakah stok tipis (di bawah 5)
  const isLowStock = product.stock < 5;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Tombol berbasis DIV dengan class dinamis sesuai kondisi stock */}
        <div
          className={`cursor-pointer p-1.5 px-3 rounded text-center font-bold text-sm inline-flex items-center gap-1 transition-colors border ${isLowStock
            ? 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20 dark:bg-destructive/20'
            : 'hover:bg-muted dark:hover:bg-muted/40 border-dashed border-muted-foreground/40 text-foreground'
            }`}
        >
          {/* Angka Stok */}
          <span>{product.stock}</span>

          {/* Label pcs */}
          <span className={`text-xs font-normal ${isLowStock ? 'text-destructive/80' : 'text-muted-foreground'}`}>
            pcs
          </span>
        </div>
      </PopoverTrigger>

      {/* Penting: stopPropagation di sini mencegah klik di popover membuka Sheet Detail Produk */}
      <PopoverContent
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
        align="center"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Quick Update Stock</h4>
            <p className="text-xs font-medium text-foreground max-w-[180px] truncate">{product.name}</p>
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
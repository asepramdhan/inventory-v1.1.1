/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link } from '@inertiajs/react';
import { MoreHorizontalIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Product({ products }: any) {
  // State untuk mengontrol Sheet (Buka/Tutup)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);

  // ----  STATE TOMBOL ----
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  // -------------------------------

  // State untuk menyimpan data produk yang sedang dipilih untuk diedit
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // State untuk menyimpan nilai asli (backend) dan nilai format (UI)
  // Kita bisa gunakan state ini bersamaan untuk Create & Edit agar hemat kode
  const [rawPrice, setRawPrice] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');

  // Fungsi untuk mereset form saat Sheet ditutup
  const resetForm = () => {
    setRawPrice('');
    setDisplayPrice('');
    setSelectedProduct(null);
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
                            <Label htmlFor="price">Harga (Rp)</Label>
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
        <div className="relative min-h-\[100vh\] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <div className="p-6">
            <Table>
              <TableCaption>Daftar seluruh produk yang tersimpan di sistem.</TableCaption>
              <TableHeader>
                <TableRow>
                  {/* 2. Sesuaikan Header dengan kolom database kita */}
                  <TableHead>Tanggal</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 3. Mapping data products dari database */}
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Belum ada produk yang ditambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any) => (
                    <TableRow key={product.id}>
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
                      <TableCell>{product.stock}</TableCell>
                      {/* Format angka ke dalam mata uang Rupiah */}
                      <TableCell>
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0
                        }).format(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
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
                                  // 1. Set produk yang dipilih
                                  setSelectedProduct(product);

                                  // 2. Isi nilai harga bawaan produk ke dalam form format rupiah
                                  setRawPrice(product.price.toString());
                                  setDisplayPrice(new Intl.NumberFormat('id-ID').format(product.price));

                                  // 3. Buka sheet edit
                                  setIsSheetOpenEdit(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              {/* Jadikan AlertDialogTrigger sebagai pembungkus Item */}
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem variant="destructive">
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

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
                      <Label htmlFor="price">Harga (Rp)</Label>
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
    {
      title: 'Master Produk',
      href: ProductController.index(),
    },
  ],
};

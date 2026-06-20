/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link } from '@inertiajs/react';
import { MoreHorizontalIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Category({ categories }: any) {
  // State untuk mengontrol Sheet (Buka/Tutup)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);

  // ----  STATE TOMBOL ----
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  // -------------------------------

  // State untuk menyimpan data produk yang sedang dipilih untuk diedit
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Fungsi untuk mereset form saat Sheet ditutup
  const resetForm = () => {
    setSelectedCategory(null);
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

              <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
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

                        {/* Input Nama Toko */}
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
                          {processing && submitAction === 'save_and_add' ? 'Menyimpan...' : 'Simpan & Tambah Kategori'}
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
              <TableCaption>Daftar seluruh kategori yang tersimpan di sistem.</TableCaption>
              <TableHeader>
                <TableRow>
                  {/* 2. Sesuaikan Header dengan kolom database kita */}
                  <TableHead className="w-\[50px\]">Tanggal</TableHead>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 3. Mapping data categories dari database */}
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      Belum ada kategori yang ditambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell>{new Date(category.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</TableCell>
                      <TableCell>{category.name}</TableCell>
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
                                  setSelectedCategory(category);
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

                  {/* Input Nama Toko */}
                  <div className="grid gap-3">
                    <Label htmlFor="name">Nama Toko / Marketplace</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedCategory?.name || ''}
                      required
                      placeholder="Contoh: Elektronik, Makanan, dll."
                    />
                    <InputError message={errors.name} />
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
    {
      title: 'Toko / Marketplace',
      href: CategoryController.index(),
    },
  ],
};

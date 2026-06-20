/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, Link } from '@inertiajs/react';
import { MoreHorizontalIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import StoreController from '@/actions/App/Http/Controllers/StoreController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Store({ stores }: any) {
  // State untuk mengontrol Sheet (Buka/Tutup)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);

  // ----  STATE TOMBOL ----
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_add'>('save');
  const [formKey, setFormKey] = useState(0);
  // -------------------------------

  // State untuk menyimpan data produk yang sedang dipilih untuk diedit
  const [selectedStore, setSelectedStore] = useState<any>(null);

  // Fungsi untuk mereset form saat Sheet ditutup
  const resetForm = () => {
    setSelectedStore(null);
  };

  return (
    <>
      <Head title="Toko / Marketplace" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Bungkus Heading dan Button dalam flex container agar sejajar */}
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

              <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
                <SheetHeader className="p-6 pb-0">
                  <SheetTitle>Tambah Toko / Marketplace</SheetTitle>
                  <SheetDescription>
                    Masukkan data toko / marketplace
                  </SheetDescription>
                </SheetHeader>

                {/* Form membungkus bodi input dan footer sekaligus */}
                <Form
                  key={`add-store-form-${formKey}`}
                  {...StoreController.store.form()}
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
                          <Label htmlFor="name">Nama Toko / Marketplace</Label>
                          <Input
                            id="name"
                            name="name"
                            required
                            placeholder="Contoh: Toko A"
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
                          {processing && submitAction === 'save' ? 'Menyimpan...' : 'Simpan Toko'}
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
              <TableCaption>Daftar seluruh toko / marketplace yang tersimpan di sistem.</TableCaption>
              <TableHeader>
                <TableRow>
                  {/* 2. Sesuaikan Header dengan kolom database kita */}
                  <TableHead className="w-\[50px\]">Tanggal</TableHead>
                  <TableHead>Nama Toko</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 3. Mapping data stores dari database */}
                {stores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Belum ada toko / marketplace yang ditambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  stores.map((store: any) => (
                    <TableRow key={store.id}>
                      <TableCell>{new Date(store.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</TableCell>
                      <TableCell>{store.name}</TableCell>
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
                                  setSelectedStore(store);
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
                                Tindakan ini tidak dapat dibatalkan. Toko / Marketplace akan dihapus secara permanen dari server.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <Link href={StoreController.destroy(store.id)}>
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
            <SheetTitle>Edit Toko / Marketplace</SheetTitle>
            <SheetDescription>
              Ubah data Toko / Marketplace
            </SheetDescription>
          </SheetHeader>

          {/* Form membungkus bodi input dan footer sekaligus */}
          <Form
            key={selectedStore?.id}
            {...StoreController.update.form(selectedStore?.id ?? 0)}
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
                      defaultValue={selectedStore?.name || ''}
                      required
                      placeholder="Contoh: Tokopedia, Bukalapak, Shopee, dll."
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

Store.layout = {
  breadcrumbs: [
    {
      title: 'Toko / Marketplace',
      href: StoreController.index(),
    },
  ],
};

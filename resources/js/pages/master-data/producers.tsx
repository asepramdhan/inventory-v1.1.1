import { Head, router, useForm } from '@inertiajs/react';
import { BookOpen, MapPin, MoreHorizontalIcon, Pencil, Phone, Plus, Text, Trash2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Producer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  total_unpaid_debt: number;
  invoices_count: number;
}

interface Props {
  producers: Producer[];
}

function ProducerFormFields({
  data,
  setData,
  errors,
  idPrefix = '',
}: {
  data: { name: string; phone: string; address: string; notes: string };
  setData: (key: 'name' | 'phone' | 'address' | 'notes', value: string) => void;
  errors: Partial<Record<'name' | 'phone' | 'address' | 'notes', string>>;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}name`}>Nama Produsen / Konveksi</Label>
        <div className="relative">
          <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}name`}
            placeholder="Contoh: Konveksi Hijab Bandung"
            className="pl-9 h-9 text-xs"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
          />
        </div>
        <InputError message={errors.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}phone`}>No. Telepon / WhatsApp (Opsional)</Label>
        <div className="relative">
          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}phone`}
            placeholder="Contoh: 08123456789"
            className="pl-9 h-9 text-xs"
            value={data.phone}
            onChange={(e) => setData('phone', e.target.value)}
          />
        </div>
        <InputError message={errors.phone} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}address`}>Alamat Workshop / Gudang (Opsional)</Label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <textarea
            id={`${idPrefix}address`}
            rows={2}
            placeholder="Masukkan alamat lengkap produsen..."
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={data.address}
            onChange={(e) => setData('address', e.target.value)}
          />
        </div>
        <InputError message={errors.address} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}notes`}>Catatan Kerja Sama (Opsional)</Label>
        <div className="relative">
          <Text className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <textarea
            id={`${idPrefix}notes`}
            rows={2}
            placeholder="Contoh: Sistem pembayaran tempo tiap hari Sabtu sore..."
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={data.notes}
            onChange={(e) => setData('notes', e.target.value)}
          />
        </div>
        <InputError message={errors.notes} />
      </div>
    </>
  );
}

function ProducersTableSkeleton() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm animate-pulse">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
            <TableRow>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nama Produsen / Konveksi</TableHead>
              <TableHead className="w-[150px] text-xs font-bold text-zinc-500 dark:text-zinc-400">No. Telepon / WA</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Alamat Gudang</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Ket. Sistem Kerja Sama</TableHead>
              <TableHead className="w-[180px] text-right text-xs font-bold text-zinc-500 dark:text-zinc-400">Sisa Hutang Tempo</TableHead>
              <TableHead className="w-[80px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4].map((i) => (
              <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800/60">
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32 py-2" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" /></TableCell>
                <TableCell className="text-right"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20 ml-auto" /></TableCell>
                <TableCell className="text-center"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Producers({ producers }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      setIsCreateOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const createForm = useForm({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const editForm = useForm({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/master-data/producers', {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
      },
    });
  };

  const handleOpenEdit = (producer: Producer) => {
    setSelectedProducer(producer);
    editForm.setData({
      name: producer.name,
      phone: producer.phone || '',
      address: producer.address || '',
      notes: producer.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducer) return;

    editForm.put(`/master-data/producers/${selectedProducer.id}`, {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedProducer(null);
        editForm.reset();
      },
    });
  };

  const handleDelete = (producerId: number) => {
    router.delete(`/master-data/producers/${producerId}`, {
      preserveScroll: true,
    });
  };

  const globalTotalDebt = producers.reduce((acc, curr) => acc + curr.total_unpaid_debt, 0);

  return (
    <>
      <Head title="Master Data Produsen" />
      <div className="flex flex-col gap-4 p-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Heading
            title="Mitra & Produsen Konveksi"
            description="Kelola daftar master data produsen supplier beserta buku kartu hutang berjalannya."
          />

          <Sheet
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) createForm.reset();
            }}
          >
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 self-start sm:self-auto shadow-sm">
                <Plus className="h-4 w-4" /> Tambah Produsen
              </Button>
            </SheetTrigger>

            <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
              <SheetHeader className="p-6 border-b bg-background">
                <SheetTitle>Tambah Master Produsen</SheetTitle>
                <SheetDescription>Daftarkan produsen atau konveksi baru untuk mempermudah pencatatan nota berkala.</SheetDescription>
              </SheetHeader>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <ProducerFormFields
                  data={createForm.data}
                  setData={createForm.setData}
                  errors={createForm.errors}
                />

                <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                  <Button type="submit" disabled={createForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    {createForm.processing ? 'Menyimpan...' : 'Simpan Master Produsen'}
                  </Button>
                  <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* TOTAL DEBT CARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Hutang (Semua Produsen)</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatIDR(globalTotalDebt)}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Total Tagihan Kredit Konveksi Belum Terbayar</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <ProducersTableSkeleton />
        ) : (
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
            <div className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nama Produsen / Konveksi</TableHead>
                    <TableHead className="w-[150px] text-xs font-bold text-zinc-500 dark:text-zinc-400">No. Telepon / WA</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Alamat Gudang</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Ket. Sistem Kerja Sama</TableHead>
                    <TableHead className="w-[180px] text-right text-xs font-bold text-zinc-500 dark:text-zinc-400">Sisa Hutang Tempo</TableHead>
                    <TableHead className="w-[80px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {producers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-muted-foreground text-sm">
                        Belum ada master data produsen. Klik tombol &quot;Tambah Produsen&quot; untuk meregistrasikan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    producers.map((prod) => (
                      <TableRow key={prod.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors border-b border-zinc-100 dark:border-zinc-800/60">
                        <TableCell className="text-xs font-bold text-foreground py-3">
                          🏢 {prod.name}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {prod.phone ? (
                            <a
                              href={`https://wa.me/${prod.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-emerald-600 hover:underline"
                            >
                              {prod.phone}
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={prod.address || undefined}>
                          {prod.address || '-'}
                        </TableCell>
                        <TableCell className="text-xs italic text-muted-foreground max-w-[220px] truncate" title={prod.notes || undefined}>
                          {prod.notes || '-'}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-extrabold ${prod.total_unpaid_debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {prod.total_unpaid_debt > 0 ? formatIDR(prod.total_unpaid_debt) : 'Lunas'}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                  <span className="sr-only">Buka menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(prod)}>
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {prod.invoices_count > 0 ? (
                                  <DropdownMenuItem disabled className="text-muted-foreground">
                                    <Trash2 className="h-4 w-4" />
                                    Hapus (ada nota)
                                  </DropdownMenuItem>
                                ) : (
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus produsen ini?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Produsen <strong className="text-foreground">{prod.name}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => handleDelete(prod.id)}>
                                  Hapus
                                </AlertDialogAction>
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
        )}

        <Sheet
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setSelectedProducer(null);
              editForm.reset();
            }
          }}
        >
          <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
            <SheetHeader className="p-6 border-b bg-background">
              <SheetTitle>Edit Master Produsen</SheetTitle>
              <SheetDescription>
                Perbarui data produsen{selectedProducer ? `: ${selectedProducer.name}` : ''}.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <ProducerFormFields
                idPrefix="edit-"
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
              />

              <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                <Button type="submit" disabled={editForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
                <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

      </div>
    </>
  );
}

Producers.layout = {
  breadcrumbs: [
    { title: 'Master Data', href: '#' },
    { title: 'Master Produsen', href: '/master-data/producers' },
  ],
};

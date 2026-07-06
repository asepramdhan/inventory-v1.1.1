/* eslint-disable curly */
/* eslint-disable @stylistic/padding-line-between-statements */
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Calendar, DollarSign, Landmark, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// PERBAIKAN UTAMA: Definisi type-safety yang ketat untuk data akun dari database
interface Account {
  id: number;
  name: string;
  type: string;
  current_balance: number;
  description: string | null;
  is_active: boolean | number;   // Menerima format boolean maupun integer (0/1) dari MySQL
  is_default: boolean | number;  // Menerima format boolean maupun integer (0/1) dari MySQL
}

interface Props {
  accounts: Account[];
  mutations: {
    data: Array<{
      id: number;
      financial_account_id: number;
      date: string;
      type: 'income' | 'expense';
      category: string;
      amount: number;
      balance_snapshot: number;
      reference_number: string;
      description: string;
      account?: { name: string; type: string };
    }>;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
  };
  summary: { total_income: number; total_expense: number; net_cash_flow: number };
  filters: { financial_account_id: string; type: string; start_date: string; end_date: string; search: string };
}

// --- KOMPONEN SKELETON LOADER KHUSUS TABEL MUTASI (PRESISI 100%) ---
function MutationsTableSkeleton() {
  return (
    <Card className="border-sidebar-border/70 shadow-sm overflow-hidden animate-pulse">
      <CardContent className="p-3">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[110px] text-xs font-bold">Tanggal</TableHead>
              <TableHead className="w-[150px] text-xs font-bold">Akun Kas</TableHead>
              <TableHead className="text-xs font-bold">Kategori / Keterangan</TableHead>
              <TableHead className="w-[150px] text-xs font-bold">No. Ref</TableHead>
              <TableHead className="text-right w-[150px] text-xs font-bold">Nominal</TableHead>
              <TableHead className="text-right w-[160px] text-xs font-bold">Saldo Berjalan</TableHead>
              <TableHead className="w-[50px] text-xs font-bold text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Membuat 4 baris riwayat mutasi palsu */}
            {[1, 2, 3, 4].map((i) => (
              <TableRow key={i} className="border-b border-muted/10">
                {/* Tanggal */}
                <TableCell>
                  <div className="h-3.5 bg-muted rounded w-16" />
                </TableCell>

                {/* Akun Kas */}
                <TableCell>
                  <div className="h-3.5 bg-muted rounded w-24 font-semibold" />
                </TableCell>

                {/* Kategori / Keterangan */}
                <TableCell className="py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 bg-muted rounded w-28 font-bold" />
                    <div className="h-3 bg-muted/50 rounded w-44" /> {/* Simulasi description */}
                  </div>
                </TableCell>

                {/* No. Ref */}
                <TableCell>
                  <div className="h-3.5 bg-muted/60 rounded w-20 font-mono" />
                </TableCell>

                {/* Nominal */}
                <TableCell className="text-right">
                  <div className="h-3.5 bg-muted rounded w-20 ml-auto font-extrabold" />
                </TableCell>

                {/* Saldo Berjalan */}
                <TableCell className="text-right">
                  <div className="h-3.5 bg-muted/70 rounded w-24 ml-auto" />
                </TableCell>

                {/* Aksi Button / Lock Tag */}
                <TableCell className="text-center py-2">
                  <div className="h-6 bg-muted/80 rounded w-8 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Mutations({ accounts, mutations, summary, filters }: Props) {
  // States Filter bawaan sinkronisasi URL
  const [search, setSearch] = useState(filters.search || '');
  const [accountFilter, setAccountFilter] = useState(filters.financial_account_id || 'all');
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  // 1. TAMBAHKAN STATE PAGE DI SINI:
  const [page, setPage] = useState(mutations.current_page || 1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // --- TAMBAHKAN STATE & EFFECT SKELETON DI SINI ---
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Beri jeda waktu mini (misal 350 milidetik) agar animasinya kelihatan mulus
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);
  // -------------------------------------------------

  // Inertia Form Handling untuk input mutasi manual
  const { data, setData, post, processing, errors, reset } = useForm({
    financial_account_id: '',
    date: (() => {
      const localDate = new Date();
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    type: 'expense',
    category: '',
    amount: '',
    reference_number: '',
    description: '',
  });

  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Form handling untuk daftarkan Akun Kas Baru
  const accountForm = useForm({
    name: '',
    type: 'bank',
    current_balance: '',
    description: '',
  });

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    accountForm.post('/finance/mutations/accounts', {
      onSuccess: () => {
        setIsAccountOpen(false);
        accountForm.reset();
      },
    });
  };

  // Fungsi untuk mengubah status Aktif / Arsip akun kas
  const handleToggleAccount = (id: number, currentActive: boolean | number) => {
    const isActiveBool = currentActive === true || currentActive === 1;
    const actionText = isActiveBool ? 'menonaktifkan (arsip)' : 'mengaktifkan kembali';
    if (confirm(`Apakah Anda yakin ingin ${actionText} akun kas ini?`)) {
      router.patch(`/finance/mutations/accounts/${id}/toggle`, {}, {
        preserveScroll: true,
      });
    }
  };

  // Fungsi untuk mengunci akun kas sebagai default pencairan toko
  const handleSetDefaultAccount = (id: number) => {
    if (confirm('Jadikan akun ini sebagai penampung otomatis utama untuk semua transaksi selesai (Completed)?')) {
      router.patch(`/finance/mutations/accounts/${id}/default`, {}, {
        preserveScroll: true,
      });
    }
  };

  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Inertia Form untuk Transfer / Penarikan Saldo
  const transferForm = useForm({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    date: (() => {
      const localDate = new Date();
      return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    })(),
    description: '',
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    transferForm.post('/finance/mutations/transfer', {
      onSuccess: () => {
        setIsTransferOpen(false);
        transferForm.reset();
      },
    });
  };

  // Ganti seluruh useEffect lama dengan ini:
  useEffect(() => {
    const timer = setTimeout(() => {
      // Ambil parameter dari URL saat ini untuk mengecek apakah filter benar-back berubah
      const urlParams = new URLSearchParams(window.location.search);
      const currentSearch = urlParams.get('search') || '';
      const currentAccount = urlParams.get('financial_account_id') || 'all';
      const currentType = urlParams.get('type') || 'all';
      const currentStart = urlParams.get('start_date') || '';
      const currentEnd = urlParams.get('end_date') || '';

      // Cek apakah user sedang mengubah isi filter/ketikan pencarian
      const isFilterChanged =
        search !== currentSearch ||
        accountFilter !== currentAccount ||
        typeFilter !== currentType ||
        startDate !== currentStart ||
        endDate !== currentEnd;

      // Jika filter diubah, paksa balik ke halaman 1. Jika tidak, ikuti state page aktif.
      const targetPage = isFilterChanged ? 1 : page;

      // Jika balik ke page 1, selaraskan juga state-nya agar tombol pagination berubah aktifnya
      if (isFilterChanged) setPage(1);

      router.get(
        '/finance/mutations',
        {
          search,
          financial_account_id: accountFilter,
          type: typeFilter,
          start_date: startDate,
          end_date: endDate,
          page: targetPage, // Kirimkan target halaman yang tepat
        },
        { preserveState: true, replace: true, preserveScroll: true }
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [search, accountFilter, typeFilter, startDate, endDate, page]); // <- Masukkan 'page' ke dalam dependency

  const handleResetFilter = () => {
    setSearch('');
    setAccountFilter('all');
    setTypeFilter('all');
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setStartDate(past.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/finance/mutations', {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
      },
    });
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Fungsi untuk mengubah angka murni menjadi string berformat titik (Contoh: 1000000 -> "1.000.000")
  const formatDisplayRupiah = (value: string | number) => {
    if (!value) return '';
    const stringValue = value.toString().replace(/\D/g, '');
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Fungsi untuk membersihkan titik saat user mengetik agar kembali jadi angka murni sebelum disimpan ke state
  const cleanRupiahValue = (value: string) => {
    return value.replace(/\./g, '');
  };

  const handleDeleteMutation = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan mutasi ini? Saldo akun kas yang bersangkutan akan dikoreksi dan dikembalikan secara otomatis.')) {
      router.delete(`/finance/mutations/${id}`, {
        preserveScroll: true,
      });
    }
  };

  return (
    <>
      <Head title="Mutasi Keuangan" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sidebar-border/60 pb-5">
          <Heading
            title="Mutasi Keuangan"
            description="Jurnal pencatatan riwayat arus uang masuk dan keluar pada kas/rekening Anda."
          />

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="text-xs h-9 border-sidebar-border/70">
                  <Landmark className="h-4 w-4 text-blue-500" />
                  Tambah Akun Kas
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
                <SheetHeader className="p-6 border-b bg-background">
                  <SheetTitle>Registrasi Akun Kas / Bank</SheetTitle>
                  <SheetDescription>Tambahkan wadah penyimpanan uang baru seperti rekening BCA, Mandiri, atau Saldo Seller Shopee.</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleAccountSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc_name">Nama Akun / Bank</Label>
                    <Input
                      id="acc_name"
                      placeholder="Contoh: Bank BCA, Saldo Shopee Seller"
                      value={accountForm.data.name}
                      onChange={(e) => accountForm.setData('name', e.target.value)}
                    />
                    <InputError message={accountForm.errors.name} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc_type">Tipe Kas</Label>
                    <Select value={accountForm.data.type} onValueChange={(val: any) => accountForm.setData('type', val)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank Transfer (BCA, Mandiri, dll)</SelectItem>
                        <SelectItem value="e-wallet">E-Wallet / Saldo Marketplace</SelectItem>
                        <SelectItem value="cash">Kas Tunai / Fisik Gudang</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={accountForm.errors.type} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc_balance">Saldo Awal Saat Ini (Rp)</Label>
                    <Input
                      id="acc_balance"
                      type="text" // UBAH ke text agar bisa disisipkan karakter titik
                      placeholder="Contoh: 1.000.000"
                      value={formatDisplayRupiah(accountForm.data.current_balance)} // Tampilkan format titik
                      onChange={(e) => accountForm.setData('current_balance', cleanRupiahValue(e.target.value))} // Simpan angka bersih ke database
                    />
                    <InputError message={accountForm.errors.current_balance} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc_desc">Keterangan / Nomor Rekening</Label>
                    <textarea
                      id="acc_desc"
                      rows={2}
                      placeholder="Nomor rekening atau catatan pemilik akun..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={accountForm.data.description || ''}
                      onChange={(e) => accountForm.setData('description', e.target.value)}
                    />
                    <InputError message={accountForm.errors.description} />
                  </div>

                  <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                    <Button type="submit" disabled={accountForm.processing}>{accountForm.processing ? 'Menyimpan...' : 'Daftarkan Akun'}</Button>
                    <SheetClose asChild><Button variant="outline" type="button">Batal</Button></SheetClose>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>

            {/* SHEET FORM TAMBAH MUTASI MANUAL */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <SheetTrigger asChild>
                <Button className="bg-primary text-primary-foreground shadow">
                  <Plus className="h-4 w-4" />
                  Catat Mutasi Kas
                </Button>
              </SheetTrigger>
              <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
                <SheetHeader className="p-6 border-b bg-background">
                  <SheetTitle>Catat Arus Mutasi Kas</SheetTitle>
                  <SheetDescription>Masukkan catatan kas masuk (income) atau pengeluaran operasional (expense) di bawah ini.</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="financial_account_id">Pilih Akun Kas/Bank</Label>
                    <Select value={data.financial_account_id} onValueChange={(val) => setData('financial_account_id', val)}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Pilih rekening/kas" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.filter((acc) => acc.is_active == true || acc.is_active == 1).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>
                            {acc.name} ({acc.type.toUpperCase()}) {acc.is_default == true || acc.is_default == 1 ? '⭐' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.financial_account_id} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="date">Tanggal Mutasi</Label>
                      <Input type="date" id="date" value={data.date} onChange={(e) => setData('date', e.target.value)} />
                      <InputError message={errors.date} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="type">Jenis Arus</Label>
                      <Select value={data.type} onValueChange={(val: any) => setData('type', val)}>
                        <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Uang Masuk (+)</SelectItem>
                          <SelectItem value="expense">Uang Keluar (-)</SelectItem>
                        </SelectContent>
                      </Select>
                      <InputError message={errors.type} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category">Kategori Dana</Label>
                    <Input
                      placeholder="Contoh: Pencairan Shopee, Saldo Iklan, Biaya Packing, Gaji Admin"
                      value={data.category}
                      onChange={(e) => setData('category', e.target.value)}
                    />
                    <InputError message={errors.category} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Nominal Uang (Rp)</Label>
                    <Input
                      id="amount"
                      type="text" // UBAH ke text
                      placeholder="Contoh: 50.000"
                      value={formatDisplayRupiah(data.amount)} // Tampilkan format titik
                      onChange={(e) => setData('amount', cleanRupiahValue(e.target.value))} // Simpan angka bersih
                    />
                    <InputError message={errors.amount} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reference_number">No. Referensi (Opsional)</Label>
                    <Input
                      placeholder="No. Invoice, No. Resi, atau Kode Transfer Bank"
                      value={data.reference_number}
                      onChange={(e) => setData('reference_number', e.target.value)}
                    />
                    <InputError message={errors.reference_number} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Keterangan Tambahan</Label>
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Detail catatan transaksi keuangan..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                    />
                    <InputError message={errors.description} />
                  </div>

                  <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                    <Button type="submit" disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Transaksi'}</Button>
                    <SheetClose asChild><Button variant="outline" type="button">Batal</Button></SheetClose>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>

            {/* SHEET FORM PENARIKAN / TRANSFER SALDO */}
            <Sheet open={isTransferOpen} onOpenChange={setIsTransferOpen}>
              <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
                <SheetHeader className="p-6 border-b bg-background">
                  <SheetTitle>Transfer / Tarik Saldo Kas</SheetTitle>
                  <SheetDescription>
                    Pindahkan dana dari akun kas utama ke akun rekening bank atau e-wallet lainnya.
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleTransferSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Akun Asal */}
                  <div className="space-y-1.5">
                    <Label>Akun Sumber (Asal Dana)</Label>
                    <Input
                      disabled
                      value={accounts.find(a => a.id.toString() === transferForm.data.from_account_id)?.name || ''}
                      className="bg-muted"
                    />
                  </div>

                  {/* Akun Tujuan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="to_account_id">Pilih Rekening Bank / Tujuan Penerima</Label>
                    <Select
                      value={transferForm.data.to_account_id}
                      onValueChange={(val) => transferForm.setData('to_account_id', val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih rekening bank tujuan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          ?.filter((acc) => (acc.is_active == true || acc.is_active == 1) && acc.id.toString() !== transferForm.data.from_account_id)
                          .map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>
                              {acc.name} ({acc.type.toUpperCase()}) - Saldo: {formatIDR(acc.current_balance)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <InputError message={transferForm.errors.to_account_id} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ts_date">Tanggal Penarikan</Label>
                      <Input type="date" id="ts_date" value={transferForm.data.date} onChange={(e) => transferForm.setData('date', e.target.value)} />
                      <InputError message={transferForm.errors.date} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ts_amount">Nominal Penarikan (Rp)</Label>
                      <Input
                        id="ts_amount"
                        type="text" // UBAH ke text
                        placeholder="Contoh: 250.000"
                        value={formatDisplayRupiah(transferForm.data.amount)} // Tampilkan format titik
                        onChange={(e) => transferForm.setData('amount', cleanRupiahValue(e.target.value))} // Simpan angka bersih
                      />
                      <InputError message={transferForm.errors.amount} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ts_description">Catatan Tambahan (Opsional)</Label>
                    <textarea
                      id="ts_description"
                      rows={3}
                      placeholder="Contoh: Tarik saldo shopee ke BCA bulanan..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={transferForm.data.description}
                      onChange={(e) => transferForm.setData('description', e.target.value)}
                    />
                    <InputError message={transferForm.errors.description} />
                  </div>

                  <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                    <Button type="submit" disabled={transferForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {transferForm.processing ? 'Memproses...' : 'Konfirmasi Penarikan'}
                    </Button>
                    <SheetClose asChild><Button variant="outline" type="button">Batal</Button></SheetClose>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* SECTION 1: RINGKASAN SALDO SELURUH AKUN (KAS UTAMA) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Posisi Saldo Kas & Rekening Aktif</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {accounts && accounts.map((acc: any) => {

              // SOLUSI UTAMA HOSTING: Normalisasi paksa nilai dari database menjadi Boolean murni
              // Ini akan membaca dengan benar baik true, 1, "1", false, 0, maupun "0"
              const isActive = acc.is_active == true || acc.is_active == 1 || acc.is_active == '1';
              const isDefault = acc.is_default == true || acc.is_default == 1 || acc.is_default == '1';

              return (
                <div
                  key={acc.id}
                  className={`relative p-4 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between ${!isActive ? 'opacity-50 bg-muted/30' : ''
                    } ${isDefault ? 'border-primary ring-1 ring-primary/30' : ''}`}
                >
                  {/* Label Indikator Status */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isDefault ? (
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                        🟢 Default Utama
                      </span>
                    ) : null}
                    {!isActive ? (
                      <span className="text-[10px] bg-destructive/10 text-destructive font-semibold px-2 py-0.5 rounded-full">
                        📁 Diarsipkan
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      {acc.type === 'bank' ? '🏦 Bank' : acc.type === 'e-wallet' ? '📱 E-Wallet' : '💵 Tunai'}
                    </p>
                    <h3 className="text-sm font-bold mt-1 text-foreground">{acc.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{acc.description || '-'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
                    <div className="text-lg font-bold tracking-tight text-foreground">
                      {isLoading ? <Skeleton className="h-7 w-[150px]" /> : formatIDR(acc.current_balance)}
                      {/* {formatIDR(acc.current_balance)} */}
                    </div>

                    {/* DERETAN TOMBOL AKSI KELOLA AKUN */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {/* JIKA DEFAULT UTAMA, TAMPILKAN TOMBOL TARIK SALDO */}
                      {isDefault && isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-emerald-600 font-bold hover:bg-emerald-500/10 border border-emerald-500/20"
                          onClick={() => {
                            transferForm.setData({
                              ...transferForm.data,
                              from_account_id: acc.id.toString(),
                              to_account_id: '',
                              amount: '',
                              description: ''
                            });
                            setIsTransferOpen(true);
                          }}
                        >
                          💸 Tarik Saldo
                        </Button>
                      ) : null}

                      {!isDefault && isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-blue-500 font-medium hover:text-blue-600 hover:bg-blue-500/10"
                          onClick={() => handleSetDefaultAccount(acc.id)}
                        >
                          Set Default
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-[11px] font-medium ${isActive ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-600 hover:bg-emerald-500/10'
                          }`}
                        onClick={() => handleToggleAccount(acc.id, acc.is_active)}
                      >
                        {isActive ? 'Arsipkan' : 'Aktifkan'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: METRICS CASH FLOW ANALYSIS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-sidebar-border/70 bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Total Arus Masuk (Income)</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="px-4 pb-4">
              <div className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {isLoading ? <Skeleton className="h-7 w-[200px]" /> : formatIDR(summary.total_income)}
                {/* {formatIDR(summary.total_income)} */}
              </div>
            </div>
          </Card>

          <Card className="border-sidebar-border/70 bg-red-50/20 dark:bg-red-950/10">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-red-600 dark:text-red-400">Total Arus Keluar (Expense)</span>
              <ArrowDownLeft className="h-4 w-4 text-red-500" />
            </div>
            <div className="px-4 pb-4">
              <div className="text-xl font-extrabold tracking-tight text-red-600 dark:text-red-400">
                {isLoading ? <Skeleton className="h-7 w-[200px]" /> : formatIDR(summary.total_expense)}
                {/* {formatIDR(summary.total_expense)} */}
              </div>
            </div>
          </Card>

          <Card className={`border-sidebar-border/70 ${summary.net_cash_flow >= 0 ? 'bg-blue-50/20 dark:bg-blue-950/10' : 'bg-amber-50/20 dark:bg-amber-950/10'}`}>
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-muted-foreground">Net Cash Flow (Arus Bersih)</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="px-4 pb-4">
              <div className={`text-xl font-black tracking-tight ${summary.net_cash_flow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}`}>
                {isLoading ? <Skeleton className="h-7 w-[200px]" /> : formatIDR(summary.net_cash_flow)}
                {/* {formatIDR(summary.net_cash_flow)} */}
              </div>
            </div>
          </Card>
        </div>

        {/* SECTION 3: FILTER CONTROLLER BAR */}
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full bg-card p-3 rounded-xl border border-sidebar-border/60 shadow-sm">
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-full sm:w-[170px] text-xs h-9"><SelectValue placeholder="Semua Akun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rekening</SelectItem>
                {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs h-9"><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe Arus</SelectItem>
                <SelectItem value="income">Masuk (+)</SelectItem>
                <SelectItem value="expense">Keluar (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2 h-9 w-full sm:w-auto">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs border-none outline-none focus:ring-0 p-0 w-28" />
              <span className="text-muted-foreground text-xs">s/d</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs border-none outline-none focus:ring-0 p-0 w-28" />
            </div>
          </div>

          <div className="relative w-full lg:max-w-xs lg:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Cari kategori, memo, atau ref..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-xs h-9 bg-background" />
          </div>

          {(search !== '' || accountFilter !== 'all' || typeFilter !== 'all') && (
            <Button variant="ghost" type="button" onClick={handleResetFilter} className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive">
              Reset
            </Button>
          )}
        </div>

        {/* LOGIKA SINKRONISASI SKELETON LOADER MUTASI */}
        {isLoading ? (
          <MutationsTableSkeleton />
        ) : (
          /* SECTION 4: DATA TABLE HISTORY MUTASI */
          <Card className="border-sidebar-border/70 shadow-sm overflow-hidden">
            <CardContent className="p-3">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[110px] text-xs font-bold">Tanggal</TableHead>
                    <TableHead className="w-[150px] text-xs font-bold">Akun Kas</TableHead>
                    <TableHead className="text-xs font-bold">Kategori / Keterangan</TableHead>
                    <TableHead className="w-[150px] text-xs font-bold">No. Ref</TableHead>
                    <TableHead className="text-right w-[150px] text-xs font-bold">Nominal</TableHead>
                    <TableHead className="text-right w-[160px] text-xs font-bold">Saldo Berjalan</TableHead>
                    <TableHead className="w-[50px] text-xs font-bold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutations?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-72 text-center p-0">
                        <Empty className="py-8">
                          <EmptyMedia><Search className="h-10 w-10 text-muted-foreground/60 stroke-[1.5]" /></EmptyMedia>
                          <EmptyHeader>
                            <EmptyTitle className="text-sm font-semibold">Tidak Ada Mutasi Ditemukan</EmptyTitle>
                            <EmptyDescription className="text-xs max-w-sm mx-auto">
                              Ganti setelan filter tanggal atau kategori Anda, atau tambahkan catatan transaksi kas baru.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    mutations?.data?.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {item.date}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {item.account?.name || 'Kas Terhapus'}
                        </TableCell>
                        <TableCell className="py-2.5 max-w-[200px] md:max-w-[300px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">{item.category}</span>
                            {item.description && (
                              <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <span className="text-[11px] text-muted-foreground truncate block cursor-help">
                                      {item.description}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs p-2">
                                    <p>{item.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {item.reference_number || '-'}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-extrabold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-muted-foreground">
                          {formatIDR(item.balance_snapshot)}
                        </TableCell>
                        {/* KODE BARU: Mengunci Berdasarkan Ada/Tidaknya Nomor Referensi */}
                        <TableCell className="text-center py-2">
                          {item.reference_number ? (
                            // Jika mutasi memiliki nomor nota/referensi, kunci otomatis! (Apapun nama kategorinya)
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-bold tracking-wide">
                              🔒 Sistem
                            </span>
                          ) : (
                            // Jika reference_number kosong (berarti input manual), tombol hapus tetap muncul bebas
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMutation(item.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {/* ================= BARIS TOMBOL PAGINATION BARU ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6 px-1">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Menampilkan <span className="font-semibold text-foreground">{mutations.from || 0}</span> sampai{" "}
            <span className="font-semibold text-foreground">{mutations.to || 0}</span> dari{" "}
            <span className="font-semibold text-foreground">{mutations.total}</span> riwayat mutasi
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {mutations.links.map((link, idx) => (
              <Button
                key={idx}
                variant={link.active ? "default" : "outline"}
                size="sm"
                className={`h-8 text-xs px-3 ${link.active ? 'pointer-events-none' : ''}`}
                disabled={!link.url}
                onClick={() => {
                  if (link.url) {
                    // Ambil angka page dari URL link bawaan Laravel (contoh: ?page=2 diambil angka 2-nya)
                    const urlObj = new URL(link.url, window.location.origin);
                    const pageNumber = urlObj.searchParams.get('page');
                    if (pageNumber) setPage(Number(pageNumber));
                  }
                }}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
        {/* ================================================================ */}
      </div>
    </>
  );
}

Mutations.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Mutasi Keuangan', href: '/finance/mutations' },
  ],
};
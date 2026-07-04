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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  accounts: Array<{
    is_default: any;
    is_active: unknown; id: number; name: string; type: string; current_balance: number; description: string
  }>;
  mutations: Array<{
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
  summary: { total_income: number; total_expense: number; net_cash_flow: number };
  filters: { financial_account_id: string; type: string; start_date: string; end_date: string; search: string };
}

export default function Mutations({ accounts, mutations, summary, filters }: Props) {
  // States Filter bawaan sinkronisasi URL
  const [search, setSearch] = useState(filters.search || '');
  const [accountFilter, setAccountFilter] = useState(filters.financial_account_id || 'all');
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Inertia Form Handling untuk input mutasi manual (MENGGUNAKAN useForm AGAR TIDAK EROR)
  const { data, setData, post, processing, errors, reset } = useForm({
    financial_account_id: '',
    // PERBAIKAN: Mengambil tanggal berdasarkan Local Timezone Browser Anda (Bukan UTC)
    date: (() => {
      const localDate = new Date();
      const year = localDate.getFullYear();
      // Tambahkan leading zero jika bulan/tanggal di bawah angka 10
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

  // const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  // const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Form handling untuk edit Akun Kas
  // const editAccountForm = useForm({
  //   name: '',
  //   description: '',
  // });

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    accountForm.post('/finance/mutations/accounts', {
      onSuccess: () => {
        setIsAccountOpen(false);
        accountForm.reset();
      },
    });
  };

  // Fungsi untuk memicu modal edit dan mengisi datanya
  // const openEditAccountModal = (account: any) => {
  //   setSelectedAccount(account);
  //   editAccountForm.setData({
  //     name: account.name,
  //     description: account.description || '',
  //   });
  //   setIsEditAccountOpen(true);
  // };

  // Fungsi submit edit akun kas
  // const handleEditAccountSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   editAccountForm.patch(`/finance/mutations/accounts/${selectedAccount.id}`, {
  //     onSuccess: () => {
  //       setIsEditAccountOpen(false);
  //     },
  //   });
  // };

  // Fungsi untuk mengubah status Aktif / Arsip akun kas
  const handleToggleAccount = (id: number, currentActive: boolean) => {
    const actionText = currentActive ? 'menonaktifkan (arsip)' : 'mengaktifkan kembali';
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

  // Efek auto-filter ketika user mengubah filter dropdown atau tanggal
  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        '/finance/mutations',
        {
          search,
          financial_account_id: accountFilter,
          type: typeFilter,
          start_date: startDate,
          end_date: endDate,
        },
        { preserveState: true, replace: true }
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [search, accountFilter, typeFilter, startDate, endDate]);

  const handleResetFilter = () => {
    setSearch('');
    setAccountFilter('all');
    setTypeFilter('all');
    // Set default ke 30 hari ke belakang
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

  // const getAccountIcon = (type: string) => {
  //   switch (type) {
  //     case 'bank': return <Landmark className="h-4 w-4 text-blue-500" />;
  //     case 'e-wallet': return <Wallet className="h-4 w-4 text-purple-500" />;
  //     default: return <DollarSign className="h-4 w-4 text-emerald-500" />;
  //   }
  // };

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
                      type="number"
                      placeholder="Masukkan saldo awal kas..."
                      value={accountForm.data.current_balance}
                      onChange={(e) => accountForm.setData('current_balance', e.target.value)}
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
                      value={accountForm.data.description}
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
                        {accounts?.filter((acc) => acc.is_active).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>
                            {acc.name} ({acc.type.toUpperCase()}) {acc.is_default ? '⭐' : ''}
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
                      type="number"
                      placeholder="Masukkan jumlah nominal..."
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
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
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          </div>
        </div>

        {/* SECTION 1: RINGKASAN SALDO SELURUH AKUN (KAS UTAMA) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Posisi Saldo Kas & Rekening Aktif</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {accounts.map((acc: any) => (
              <div
                key={acc.id}
                className={`relative p-4 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between ${acc.is_active === false || acc.is_active === 0 ? 'opacity-50 bg-muted/30' : ''
                  } ${acc.is_default ? 'border-primary ring-1 ring-primary/30' : ''}`}
              >
                {/* Label Indikator Status - DIUBAH MENJADI BANDING TEGAS AGAR ANTI-0 */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {Boolean(acc.is_default) && (
                    <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                      🟢 Default Utama
                    </span>
                  )}
                  {(acc.is_active == false || acc.is_active == 0) && (
                    <span className="text-[10px] bg-destructive/10 text-destructive font-semibold px-2 py-0.5 rounded-full">
                      📁 Diarsipkan
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    {acc.type == 'bank' ? '🏦 Bank' : acc.type == 'e-wallet' ? '📱 E-Wallet' : '💵 Tunai'}
                  </p>
                  <h3 className="text-sm font-bold mt-1 text-foreground">{acc.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{acc.description || '-'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
                  <div className="text-lg font-bold tracking-tight text-foreground">
                    {formatIDR(acc.current_balance)}
                  </div>

                  {/* DERETAN TOMBOL AKSI KELOLA AKUN */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {/* Menggunakan ternary atau pembungkus Boolean agar tidak mencetak angka 0 ke DOM */}
                    {!acc.is_default && (acc.is_active == true || acc.is_active == 1) ? (
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
                      className={`h-7 px-2 text-[11px] font-medium ${acc.is_active ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-600 hover:bg-emerald-500/10'
                        }`}
                      onClick={() => handleToggleAccount(acc.id, acc.is_active)}
                    >
                      {acc.is_active ? 'Arsipkan' : 'Aktifkan'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
              <div className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{formatIDR(summary.total_income)}</div>
            </div>
          </Card>

          <Card className="border-sidebar-border/70 bg-red-50/20 dark:bg-red-950/10">
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-red-600 dark:text-red-400">Total Arus Keluar (Expense)</span>
              <ArrowDownLeft className="h-4 w-4 text-red-500" />
            </div>
            <div className="px-4 pb-4">
              <div className="text-xl font-extrabold tracking-tight text-red-600 dark:text-red-400">{formatIDR(summary.total_expense)}</div>
            </div>
          </Card>

          <Card className={`border-sidebar-border/70 ${summary.net_cash_flow >= 0 ? 'bg-blue-50/20 dark:bg-blue-950/10' : 'bg-amber-50/20 dark:bg-amber-950/10'}`}>
            <div className="p-4 flex flex-row items-center justify-between pb-1">
              <span className="text-xs font-bold text-muted-foreground">Net Cash Flow (Arus Bersih)</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="px-4 pb-4">
              <div className={`text-xl font-black tracking-tight ${summary.net_cash_flow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}`}>
                {formatIDR(summary.net_cash_flow)}
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

        {/* SECTION 4: DATA TABLE HISTORY MUTASI */}
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
                {mutations?.length === 0 ? (
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
                  mutations?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {item.date}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {item.account?.name || 'Kas Terhapus'}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-foreground">{item.category}</span>
                          {item.description && <span className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</span>}
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
                      <TableCell className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMutation(item.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
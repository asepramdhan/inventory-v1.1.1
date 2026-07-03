/* eslint-disable @stylistic/padding-line-between-statements */
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Calendar, DollarSign, Landmark, Plus, Search, Wallet } from 'lucide-react';
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
  accounts: Array<{ id: number; name: string; type: string; current_balance: number; description: string }>;
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
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    amount: '',
    reference_number: '',
    description: '',
  });

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

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="h-4 w-4 text-blue-500" />;
      case 'e-wallet': return <Wallet className="h-4 w-4 text-purple-500" />;
      default: return <DollarSign className="h-4 w-4 text-emerald-500" />;
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
                    <SelectTrigger><SelectValue placeholder="Pilih rekening/kas" /></SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name} ({acc.type.toUpperCase()})</SelectItem>
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
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

        {/* SECTION 1: RINGKASAN SALDO SELURUH AKUN (KAS UTAMA) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Posisi Saldo Kas & Rekening Aktif</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {accounts?.length === 0 ? (
              <Card className="col-span-full border border-dashed py-4 text-center text-xs text-muted-foreground">
                Belum ada akun kas terdaftar di database.
              </Card>
            ) : (
              accounts?.map((acc) => (
                <Card key={acc.id} className="border-sidebar-border/70 bg-card">
                  <div className="p-4 flex flex-row items-center justify-between pb-1">
                    <span className="text-xs font-bold text-muted-foreground">{acc.name}</span>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-lg font-extrabold tracking-tight text-foreground">{formatIDR(acc.current_balance)}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{acc.type} account</p>
                  </div>
                </Card>
              ))
            )}
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
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[110px] text-xs font-bold">Tanggal</TableHead>
                  <TableHead className="w-[150px] text-xs font-bold">Akun Kas</TableHead>
                  <TableHead className="text-xs font-bold">Kategori / Keterangan</TableHead>
                  <TableHead className="w-[150px] text-xs font-bold">No. Ref</TableHead>
                  <TableHead className="text-right w-[150px] text-xs font-bold">Nominal</TableHead>
                  <TableHead className="text-right w-[160px] text-xs font-bold">Saldo Berjalan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mutations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-72 text-center p-0">
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
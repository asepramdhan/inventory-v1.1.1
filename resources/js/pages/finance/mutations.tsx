/* eslint-disable curly */
/* eslint-disable @stylistic/padding-line-between-statements */
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Calendar, Check, Coins, DollarSign, Eye, EyeOff, Landmark, Pencil, Plus, Search, Trash2, TrendingUp, TrendingDown, Wallet, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const STORAGE_KEY_SHOW_BALANCE = 'mutations_show_balance';
const STORAGE_KEY_HIDDEN_ACCOUNTS = 'mutations_hidden_account_balances';

const loadShowBalance = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY_SHOW_BALANCE);
  return stored === null ? true : stored === 'true';
};

const loadHiddenAccountBalances = (): Set<number> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HIDDEN_ACCOUNTS);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored) as number[]);
  } catch {
    return new Set();
  }
};

interface Props {
  accounts: Account[];
  mutations: {
    data: Array<{
      id: number;
      financial_account_id: number;
      date: string;
      created_at: string;
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
  summary: {
    total_income: number;
    total_expense: number;
    total_withdrawal?: number;
    net_cash_flow: number;
    today_personal_expense?: number;
    month_personal_expense?: number;
  };
  typeCounts: { all: number; income: number; expense: number };
  filters: { financial_account_id: string; type: string; start_date: string; end_date: string; search: string };
}

// --- KOMPONEN SKELETON LOADER KHUSUS TABEL MUTASI (PRESISI 100%) ---
function MutationsTableSkeleton() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 animate-pulse">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
            <TableRow>
              <TableHead className="w-[130px] text-xs font-bold">Tanggal</TableHead>
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
              <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                {/* Tanggal */}
                <TableCell>
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
                </TableCell>

                {/* Akun Kas */}
                <TableCell>
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-24 font-semibold" />
                </TableCell>

                {/* Kategori / Keterangan */}
                <TableCell className="py-2.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-28 font-bold" />
                    <div className="h-3 bg-zinc-105 dark:bg-zinc-800 rounded w-44" /> {/* Simulasi description */}
                  </div>
                </TableCell>

                {/* No. Ref */}
                <TableCell>
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-20 font-mono" />
                </TableCell>

                {/* Nominal */}
                <TableCell className="text-right">
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-20 ml-auto font-extrabold" />
                </TableCell>

                {/* Saldo Berjalan */}
                <TableCell className="text-right">
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-24 ml-auto" />
                </TableCell>

                {/* Aksi Button / Lock Tag */}
                <TableCell className="text-center py-2">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-8 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const popularIncomeCategories = [
  'Omzet Penjualan',
  'Transfer Masuk',
  'Pencairan Saldo Toko',
  'Modal Tambahan'
];

const popularExpenseCategories = [
  'Tarik Tunai',
  'Pelunasan Produsen',
  'Gaji Karyawan',
  'Biaya Iklan & Affiliate',
  'Biaya Packing / Plastik',
  'Operasional Gudang',
  'Transfer Keluar'
];

export default function Mutations({ accounts, mutations, summary, typeCounts, filters }: Props) {
  // States Filter bawaan sinkronisasi URL
  const [search, setSearch] = useState(filters.search || '');
  const [accountFilter, setAccountFilter] = useState(filters.financial_account_id || 'all');
  const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
  const [startDate, setStartDate] = useState(filters.start_date || '');
  const [endDate, setEndDate] = useState(filters.end_date || '');
  const [showBalance, setShowBalance] = useState<boolean>(() => loadShowBalance());
  const [hiddenAccountBalances, setHiddenAccountBalances] = useState<Set<number>>(() => loadHiddenAccountBalances());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SHOW_BALANCE, String(showBalance));
  }, [showBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HIDDEN_ACCOUNTS, JSON.stringify([...hiddenAccountBalances]));
  }, [hiddenAccountBalances]);

  const toggleAccountBalanceVisibility = (accountId: number) => {
    setHiddenAccountBalances((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  const isAccountBalanceVisible = (accountId: number) => {
    return showBalance && !hiddenAccountBalances.has(accountId);
  };

  // Gunakan typeCounts dari backend untuk badge tabs (total data, bukan filtered)
  const countAll = typeCounts?.all ?? 0;
  const countIncome = typeCounts?.income ?? 0;
  const countExpense = typeCounts?.expense ?? 0;

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
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', description: '' });
  const [savingAccountId, setSavingAccountId] = useState<number | null>(null);

  // Form handling untuk daftarkan Akun Kas Baru
  const accountForm = useForm({
    name: '',
    type: 'bank',
    current_balance: '',
    description: '',
  });

  const startEditAccount = (acc: Account) => {
    setEditingAccountId(acc.id);
    setEditDraft({
      name: acc.name,
      description: acc.description || '',
    });
  };

  const cancelEditAccount = () => {
    setEditingAccountId(null);
    setEditDraft({ name: '', description: '' });
  };

  const saveEditAccount = (id: number) => {
    if (!editDraft.name.trim()) return;
    setSavingAccountId(id);
    router.patch(`/finance/mutations/accounts/${id}`, {
      name: editDraft.name.trim(),
      description: editDraft.description,
    }, {
      preserveScroll: true,
      onSuccess: () => cancelEditAccount(),
      onFinish: () => setSavingAccountId(null),
    });
  };

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
  const transferAmountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTransferOpen) {
      setTimeout(() => {
        transferAmountInputRef.current?.focus();
        transferAmountInputRef.current?.select();
      }, 150);
    }
  }, [isTransferOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'create') {
      setIsCreateOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (action === 'create-account') {
      setIsAccountOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (action === 'transfer') {
      setIsTransferOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: '-', timeStr: '-' };
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace('.', ':');
    return { dateStr, timeStr };
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Heading
            title="Mutasi Keuangan"
            description="Jurnal pencatatan riwayat arus uang masuk dan keluar pada kas/rekening Anda."
          />

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <Sheet open={isAccountOpen} onOpenChange={setIsAccountOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-1.5 w-full sm:w-auto">
                  <Landmark className="h-4 w-4 text-blue-500" />
                  Tambah Akun
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
                <Button className="bg-primary text-primary-foreground shadow gap-1.5 w-full sm:w-auto">
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
                            {acc.name} ({acc.type.toUpperCase()}) - Saldo: {formatIDR(acc.current_balance)} {acc.is_default == true || acc.is_default == 1 ? '⭐' : ''}
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
                      id="category"
                      placeholder="Contoh: Pencairan Shopee, Saldo Iklan, Biaya Packing, Gaji Admin"
                      value={data.category}
                      onChange={(e) => setData('category', e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(data.type === 'income' ? popularIncomeCategories : popularExpenseCategories).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setData('category', cat)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200/40 dark:border-zinc-800/80 font-medium"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
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
                    </div>                     <div className="space-y-1.5">
                      <Label htmlFor="ts_amount">Nominal Penarikan (Rp)</Label>
                      <Input
                        ref={transferAmountInputRef}
                        id="ts_amount"
                        type="text" // UBAH ke text
                        placeholder="Contoh: 250.000"
                        value={formatDisplayRupiah(transferForm.data.amount)} // Tampilkan format titik
                        onChange={(e) => transferForm.setData('amount', cleanRupiahValue(e.target.value))} // Simpan angka bersih
                      />
                      {transferForm.data.from_account_id && (
                        <button
                          type="button"
                          onClick={() => {
                            const fromAcc = accounts.find(a => a.id.toString() === transferForm.data.from_account_id);
                            if (fromAcc) {
                              transferForm.setData('amount', Math.round(fromAcc.current_balance).toString());
                            }
                          }}
                          className="text-[10px] text-emerald-600 hover:underline font-semibold block text-right w-full mt-1"
                        >
                          Tarik Semua (Saldo: {formatIDR(accounts.find(a => a.id.toString() === transferForm.data.from_account_id)?.current_balance ?? 0)})
                        </button>
                      )}
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

        {/* ================= TABS FILTER TYPE ================= */}
        <div className="flex w-full justify-center my-4 overflow-x-auto no-scrollbar">
          <Tabs
            value={typeFilter}
            onValueChange={setTypeFilter}
            className="w-auto"
          >
            <TabsList className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/40 p-1 gap-1 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/80">

              <TabsTrigger value="all" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <Wallet className="h-3.5 w-3.5 text-zinc-500" />
                Semua
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-zinc-200/60 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-full">
                  {countAll}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="income" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                Uang Masuk
                <Badge className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                  {countIncome}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="expense" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                Uang Keluar
                <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-bold rounded-full">
                  {countExpense}
                </Badge>
              </TabsTrigger>

            </TabsList>
          </Tabs>
        </div>

        {/* SECTION 1: RINGKASAN SALDO SELURUH AKUN (KAS UTAMA) */}
        <div className="space-y-2">
          {/* Baris Judul + Tombol Eye Toggle Global */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Posisi Saldo Kas & Rekening Aktif
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              <span className="text-xs">{showBalance ? 'Sembunyikan' : 'Tampilkan'}</span>
            </Button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-3 pt-1 w-full scrollbar-thin snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {accounts && accounts.map((acc: Account) => {
              const isActive = acc.is_active == true || acc.is_active == 1;
              const isDefault = acc.is_default == true || acc.is_default == 1;
              const isEditing = editingAccountId === acc.id;

              return (
                <div key={acc.id} className={`group/card relative p-5 rounded-2xl border bg-white dark:bg-zinc-900/50 text-card-foreground shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 w-[280px] sm:w-[300px] shrink-0 snap-start ${!isActive ? 'opacity-50 bg-zinc-105/40 dark:bg-zinc-800/20' : ''} ${isDefault ? 'border-emerald-500/80 shadow-emerald-500/5 dark:border-emerald-500/40 ring-1 ring-emerald-500/30' : 'border-zinc-200/50 dark:border-zinc-800/80'} ${isEditing ? 'ring-2 ring-primary/40 border-primary/50' : ''}`} >

                  {/* Label Indikator Status */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {isDefault ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20"> 🟢 Default </span>
                    ) : null}
                    {!isActive ? (
                      <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full"> Arsip </span>
                    ) : null}
                  </div>

                  <div className="pr-16">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      {acc.type === 'bank' ? '🏦 Bank' : acc.type === 'e-wallet' ? '📱 E-Wallet' : '💵 Tunai'}
                    </p>

                    {isEditing ? (
                      <div className="mt-1.5 space-y-2">
                        <Input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Nama akun / bank"
                          className="h-8 text-sm font-bold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditAccount(acc.id);
                            if (e.key === 'Escape') cancelEditAccount();
                          }}
                        />
                        <Input
                          value={editDraft.description}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Keterangan / nomor rekening"
                          className="h-7 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditAccount(acc.id);
                            if (e.key === 'Escape') cancelEditAccount();
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            disabled={!editDraft.name.trim() || savingAccountId === acc.id}
                            onClick={() => saveEditAccount(acc.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {savingAccountId === acc.id ? 'Menyimpan...' : 'Simpan'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            disabled={savingAccountId === acc.id}
                            onClick={cancelEditAccount}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="mt-1 cursor-pointer rounded-md -mx-1 px-1 py-0.5 hover:bg-muted/60 transition-colors"
                        onClick={() => startEditAccount(acc)}
                        title="Klik untuk edit nama & keterangan"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-sm font-bold text-foreground leading-snug">{acc.name}</h3>
                          <Pencil className="h-3 w-3 text-muted-foreground/40 shrink-0 mt-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{acc.description || 'Klik untuk tambah keterangan...'}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
                    {/* LOGIKA SENSOR NOMINAL SALDO */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-lg font-bold tracking-tight text-foreground min-h-[28px] flex items-center">
                        {isLoading ? (
                          <Skeleton className="h-7 w-[150px]" />
                        ) : isAccountBalanceVisible(acc.id) ? (
                          formatIDR(acc.current_balance)
                        ) : (
                          <span className="tracking-widest font-black text-muted-foreground/80">••••••</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleAccountBalanceVisibility(acc.id)}
                        title={hiddenAccountBalances.has(acc.id) ? 'Tampilkan saldo akun ini' : 'Sembunyikan saldo akun ini'}
                      >
                        {hiddenAccountBalances.has(acc.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {/* DERETAN TOMBOL AKSI KELOLA AKUN */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {isDefault && isActive ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-emerald-600 font-bold hover:bg-emerald-500/10 border border-emerald-500/20" onClick={() => {
                          transferForm.setData({
                            ...transferForm.data,
                            from_account_id: acc.id.toString(),
                            to_account_id: '',
                            amount: Math.round(acc.current_balance).toString(),
                            description: ''
                          });
                          setIsTransferOpen(true);
                        }} > 💸 Tarik Saldo </Button>
                      ) : null}
                      {!isDefault && isActive ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-blue-500 font-medium hover:text-blue-600 hover:bg-blue-500/10" onClick={() => handleSetDefaultAccount(acc.id)} > Set Default </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" className={`h-7 px-2 text-[11px] font-medium ${isActive ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-600 hover:bg-emerald-500/10'}`} onClick={() => handleToggleAccount(acc.id, acc.is_active)} > {isActive ? 'Arsipkan' : 'Aktifkan'} </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* SECTION 2: METRICS CASH FLOW ANALYSIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Arus Masuk</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {isLoading ? <Skeleton className="h-8 w-[180px]" /> : formatIDR(summary.total_income)}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Uang Masuk / Pendapatan</p>
            </div>
          </div>

          <div className="relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Arus Keluar</span>
              <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-transform duration-300">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {isLoading ? <Skeleton className="h-8 w-[180px]" /> : formatIDR(summary.total_expense)}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Uang Keluar / Pengeluaran</p>
            </div>
          </div>

          <div className="relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Tarik Tunai</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {isLoading ? <Skeleton className="h-8 w-[180px]" /> : formatIDR(summary.total_withdrawal ?? 0)}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Penarikan Uang Untuk Pribadi</p>
            </div>
          </div>

          <div className="relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Net Cash Flow</span>
              <div className={`h-8 w-8 rounded-lg ${summary.net_cash_flow >= 0 ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20'} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                <DollarSign className={`h-4 w-4 ${summary.net_cash_flow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {isLoading ? <Skeleton className="h-8 w-[180px]" /> : formatIDR(summary.net_cash_flow)}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Arus Bersih Seluruh Kas</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: FILTER CONTROLLER BAR */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                <SelectValue placeholder="Semua Akun" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Rekening</SelectItem>
                {accounts?.map((acc) => <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {(search !== '' || accountFilter !== 'all' || startDate !== '' || endDate !== '') && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleResetFilter}
                className="text-xs h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 transition-colors"
              >
                Reset Filter
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:ml-auto">
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl px-3 h-10 w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-0 p-0 text-xs focus:outline-none focus:ring-0 w-[115px] outline-none h-auto" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-0 p-0 text-xs focus:outline-none focus:ring-0 w-[115px] outline-none h-auto" />
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
              <Input type="search" placeholder="Cari kategori, memo, atau ref..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80" />
            </div>
          </div>
        </div>

        {/* LOGIKA SINKRONISASI SKELETON LOADER MUTASI */}
        {isLoading ? (
          <MutationsTableSkeleton />
        ) : (
          /* SECTION 4: DATA TABLE HISTORY MUTASI */
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
            <div className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                  <TableRow>
                    <TableHead className="w-[130px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Tanggal</TableHead>
                    <TableHead className="w-[150px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Akun Kas</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Kategori / Keterangan</TableHead>
                    <TableHead className="w-[150px] text-xs font-bold text-zinc-500 dark:text-zinc-400">No. Ref</TableHead>
                    <TableHead className="text-right w-[150px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Nominal</TableHead>
                    <TableHead className="text-right w-[160px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Saldo Berjalan</TableHead>
                    <TableHead className="w-[50px] text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center">Aksi</TableHead>
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
                    mutations?.data?.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors border-b border-zinc-100 dark:border-zinc-800/60">
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-foreground">
                              {formatDateTime(item.created_at).dateStr}
                            </span>
                            <span className="text-[11px] text-muted-foreground italic">
                              Pukul {formatDateTime(item.created_at).timeStr} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground py-3">
                          {item.account?.name || 'Kas Terhapus'}
                        </TableCell>
                        <TableCell className="py-3 max-w-[200px] md:max-w-[300px]">
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
                        <TableCell className="text-xs font-mono text-muted-foreground py-3">
                          {item.reference_number ? (
                            <span className="bg-muted/50 px-2 py-0.5 rounded text-[10px] font-mono">{item.reference_number}</span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-extrabold py-3 ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-muted-foreground py-3">
                          {formatIDR(item.balance_snapshot)}
                        </TableCell>
                        {/* KODE BARU: Mengunci Berdasarkan Ada/Tidaknya Nomor Referensi */}
                        <TableCell className="text-center py-3">
                          {item.reference_number ? (
                            // Jika mutasi memiliki nomor nota/referensi, kunci otomatis! (Apapun nama kategorinya)
                            <span className="text-[10px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md font-bold tracking-wide border border-border/50">
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
            </div>
          </div>
        )}
        {/* ================= BARIS TOMBOL PAGINATION BARU ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-6 px-1">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center sm:text-left">
            Menampilkan <span className="font-semibold text-zinc-900 dark:text-zinc-50">{mutations.from || 0}</span> sampai{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">{mutations.to || 0}</span> dari{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">{mutations.total}</span> riwayat mutasi
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {mutations.links.map((link, idx) => (
              <Button
                key={idx}
                variant={link.active ? "default" : "outline"}
                size="sm"
                className={`h-8 text-xs px-3 rounded-xl transition-all duration-200 ${link.active ? 'pointer-events-none shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!link.url}
                onClick={() => {
                  if (link.url) {
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
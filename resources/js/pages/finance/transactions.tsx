/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, router } from '@inertiajs/react';
import { Box, Check, Copy, EyeIcon, FileSpreadsheet, Package, Plus, RefreshCw, Search, ShoppingBag, Trash2, Truck, XCircle, CheckCircle, MoreVertical, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TransactionController from '@/actions/App/Http/Controllers/TransactionController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'absolute';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        e.currentTarget.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);
        document.execCommand('copy');
        e.currentTarget.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin teks ke clipboard:', err);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-muted ml-1.5 inline-flex items-center justify-center rounded-md transition-colors relative"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 transition-all scale-110" />
      ) : (
        <Copy className="h-3 w-3 transition-all" />
      )}
    </Button>
  );
}

const getLocalDatetimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- KOMKOMPEN SKELETON LOADER KHUSUS DATA TRANSAKSI (PRESISI 100%) ---
function TransactionsTableSkeleton() {
  return (
    <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border animate-pulse">
      <div className="p-6">
        <Table>
          <TableCaption className='py-6'>Arsip rekaman penjualan masuk produk omnichannel Anda.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"><div className="h-4 w-4 bg-muted rounded" /></TableHead>
              <TableHead>Gambar</TableHead>
              <TableHead>Tanggal Transaksi</TableHead>
              <TableHead>No. Pesanan</TableHead>
              <TableHead>Toko / Platform</TableHead>
              <TableHead>Total Bayar</TableHead>
              <TableHead>Biaya Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Membuat 4 baris loading belang-belang palsu */}
            {[1, 2, 3, 4].map((i) => (
              <TableRow key={i} className={i % 2 === 0 ? 'bg-muted/25' : 'bg-background'}>
                {/* Checkbox */}
                <TableCell><div className="h-4 w-4 bg-muted rounded" /></TableCell>

                {/* Gambar Produk */}
                <TableCell>
                  <div className="w-12 h-12 rounded-sm bg-muted border" />
                </TableCell>

                {/* Tanggal Transaksi */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="h-3.5 bg-muted rounded w-20" />
                    <div className="h-2.5 bg-muted/60 rounded w-24" />
                  </div>
                </TableCell>

                {/* No. Pesanan */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 bg-muted rounded w-28 font-mono" />
                    <div className="h-5 w-5 bg-muted/50 rounded" /> {/* Simulasi CopyButton */}
                  </div>
                </TableCell>

                {/* Toko / Platform */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="h-3.5 bg-muted rounded w-24" />
                    <div className="h-2.5 bg-muted/60 rounded w-14" />
                  </div>
                </TableCell>

                {/* Total Bayar */}
                <TableCell><div className="h-3.5 bg-muted rounded w-20 font-bold" /></TableCell>

                {/* Biaya Admin */}
                <TableCell><div className="h-3.5 bg-muted/70 rounded w-16 font-medium" /></TableCell>

                {/* Status Badge */}
                <TableCell><div className="h-5 bg-muted rounded-full w-16" /></TableCell>

                {/* Aksi Button */}
                <TableCell className="text-right">
                  <div className="h-8 w-8 bg-muted rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Panel Navigasi Halaman Palsu */}
        <div className="flex items-center justify-between px-2 py-4 border-t border-sidebar-border/50 dark:border-sidebar-border mt-4">
          <div className="h-4 bg-muted rounded w-52" />
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16" />
            <div className="h-8 bg-muted rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transactions({ transactions, storesList, productsList, filters, statusCounts }: any) {
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

  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tx_filter_search') || filters.search || '';
    }
    return filters.search || '';
  });

  const [storeFilter, setStoreFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tx_filter_store') || filters.store_id || 'all';
    }
    return filters.store_id || 'all';
  });

  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tx_filter_status') || filters.status || 'all';
    }
    return filters.status || 'all';
  });

  // Efek untuk menyimpan filter transaksi ke localStorage saat ada perubahan
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tx_filter_search', search);
      localStorage.setItem('tx_filter_store', storeFilter);
      localStorage.setItem('tx_filter_status', statusFilter);
    }
  }, [search, storeFilter, statusFilter]);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // REFS UNTUK AUTO FOCUS
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  // STATE MANAGEMENT PENCARIAN PRODUK
  const [openProductSearchIndex, setOpenProductSearchIndex] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const productInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [storeId, setStoreId] = useState<string>('');
  const [status, setStatus] = useState<string>('pending');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(getLocalDatetimeString());
  const [submitAction, setSubmitAction] = useState<'save_close' | 'save_another'>('save_close');

  const [rawAffiliate, setRawAffiliate] = useState('');
  const [displayAffiliate, setDisplayAffiliate] = useState('');
  const [rawDiscount, setRawDiscount] = useState('');
  const [displayDiscount, setDisplayDiscount] = useState('');

  const [items, setItems] = useState<any[]>([
    { product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }
  ]);

  // Efek memicu Auto Focus saat form tambah transaksi manual dibuka
  useEffect(() => {
    if (isCreateSheetOpen) {
      setTimeout(() => {
        invoiceInputRef.current?.focus();
      }, 150);
    }
  }, [isCreateSheetOpen]);

  // Ganti 'openProductDropdown' dengan nama state dropdown produk Anda
  useEffect(() => {
    if (openProductSearchIndex) {
      // Beri sedikit timeout 50ms agar animasi popover selesai terbuka dulu baru di-focus
      const timer = setTimeout(() => {
        productInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [openProductSearchIndex]);

  useEffect(() => {
    setSelectedIds([]);
  }, [transactions]);

  useEffect(() => {
    if (selectedTransaction) {
      const freshData = transactions.data.find((tx: any) => tx.id === selectedTransaction.id);
      if (freshData) {
        setSelectedTransaction(freshData);
      }
    }
  }, [transactions.data]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get(
        TransactionController.index(),
        { search, store_id: storeFilter, status: statusFilter },
        { preserveState: true, replace: true }
      );
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, storeFilter, statusFilter]);

  const handleResetFilter = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tx_filter_search');
      localStorage.removeItem('tx_filter_store');
      localStorage.removeItem('tx_filter_status');
    }
    setSearch('');
    setStoreFilter('all');
    setStatusFilter('all');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = transactions.data.map((tx: any) => tx.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (txId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, txId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== txId));
    }
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    router.patch('/finance/transactions/bulk-status', {
      ids: selectedIds,
      status: newStatus,

      // Tambahkan 3 baris ini agar backend tahu filter apa yang sedang aktif saat ini
      search: search,
      store_id: storeFilter,
      status_filter: statusFilter // gunakan 'status_filter' agar tidak bentrok dengan key 'status' baru di atas
    }, {
      preserveState: true,   // Mempertahankan state filter di frontend agar tidak ter-reset
      preserveScroll: true, // Mempertahankan posisi scroll tabel
      onSuccess: () => {
        setSelectedIds([]);
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    router.post('/finance/transactions/bulk-delete', { ids: selectedIds }, {
      onSuccess: () => setSelectedIds([]),
      preserveScroll: true
    });
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const idsQuery = selectedIds.join(',');
    window.location.href = `/finance/transactions/export?ids=${idsQuery}`;
  };

  // State untuk memantau loading status saat upload excel
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [shopeeUploadProcessing, setShopeeUploadProcessing] = useState(false);
  const [shopeeStoreId, setShopeeStoreId] = useState<string>('');
  const shopeeFileInputRef = useRef<HTMLInputElement>(null);
  const statusFileInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadProcessing(true);

      // Menggunakan URL string langsung agar sinkron dengan standard codingan Anda yang lain
      router.post('/finance/transactions/import-excel', formData, {
        forceFormData: true,
        onSuccess: () => {
          setUploadProcessing(false);
          // Anda bisa mengganti alert ini dengan toast library Anda jika diperlukan
          // alert('Status pesanan berhasil diperbarui!');
          if (e.target) e.target.value = '';
        },
        onError: (err: any) => {
          setUploadProcessing(false);
          alert(err.file || 'Gagal mengupload file Excel.');
          if (e.target) e.target.value = '';
        },
        onFinish: () => {
          setUploadProcessing(false);
        }
      });
    }
  };

  const handleShopeeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!shopeeStoreId) {
        alert('Pilih toko terlebih dahulu untuk impor pesanan.');
        if (e.target) e.target.value = '';
        return;
      }

      const selectedFile = e.target.files[0];

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('store_id', shopeeStoreId);

      setShopeeUploadProcessing(true);

      router.post('/finance/transactions/import-shopee', formData, {
        forceFormData: true,
        onSuccess: () => {
          setShopeeUploadProcessing(false);
          if (e.target) e.target.value = '';
        },
        onError: (err: any) => {
          setShopeeUploadProcessing(false);
          alert(err.file || 'Gagal mengimpor pesanan.');
          if (e.target) e.target.value = '';
        },
        onFinish: () => {
          setShopeeUploadProcessing(false);
        }
      });
    }
  };

  const triggerShopeeUpload = () => {
    if (!shopeeStoreId) {
      alert('Pilih toko terlebih dahulu untuk impor pesanan.');
      return;
    }
    shopeeFileInputRef.current?.click();
  };

  const triggerStatusUpload = () => {
    statusFileInputRef.current?.click();
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDiscountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setRawDiscount(numericValue);
    setDisplayDiscount(numericValue ? new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10)) : '');
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];

    if (field === 'selling_price') {
      const numericValue = value.replace(/\D/g, '');
      updatedItems[index]['selling_price'] = numericValue;
      updatedItems[index]['display_selling_price'] = numericValue
        ? new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10))
        : '';
    } else if (field === 'product_id') {
      updatedItems[index]['product_id'] = value;
      const selectedProd = productsList.find((p: any) => p.id.toString() === value);
      if (selectedProd) {
        const basePrice = selectedProd.price ? Math.round(selectedProd.price).toString() : '0';
        updatedItems[index]['selling_price'] = basePrice;
        updatedItems[index]['display_selling_price'] = selectedProd.price
          ? new Intl.NumberFormat('id-ID').format(selectedProd.price)
          : '0';
      }
    } else {
      updatedItems[index][field] = value;
    }

    setItems(updatedItems);
  };

  const handleAffiliateChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setRawAffiliate(numericValue);
    setDisplayAffiliate(numericValue ? new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10)) : '');
  };

  const resetForm = () => {
    setStoreId('');
    setStatus('pending');
    setInvoiceNumber('');
    setTransactionDate(getLocalDatetimeString());
    setRawDiscount('');
    setDisplayDiscount('');
    setItems([{ product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }]);
    setRawAffiliate('');
    setDisplayAffiliate('');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: '-', timeStr: '-' };
    const cleanDateString = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
    const date = new Date(cleanDateString);
    return {
      dateStr: date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      timeStr: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
    };
  };

  // Ambil array datanya dengan aman, pastikan fallback ke array kosong [] jika null
  const transactionList = Array.isArray(transactions) ? transactions : (transactions?.data || []);

  // Gunakan statusCounts dari backend untuk badge tabs (total data, bukan filtered)
  const countAll = statusCounts?.all ?? 0;
  const countPending = statusCounts?.pending ?? 0;
  const countProcessing = statusCounts?.processing ?? 0;
  const countCompleted = statusCounts?.completed ?? 0;
  const countCancelled = statusCounts?.cancelled ?? 0;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">Selesai</Badge>;
      case 'processing':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">Diproses</Badge>;
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">Menunggu</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalHppSnapshotSum = selectedTransaction?.items?.reduce((acc: number, item: any) => {
    return acc + (parseFloat(item.total_hpp_snapshot) * item.quantity);
  }, 0) || 0;

  const netProfitCalculated = selectedTransaction
    ? (parseFloat(selectedTransaction.grand_total) -
      parseFloat(selectedTransaction.marketplace_admin_fee) -
      parseFloat(selectedTransaction.affiliate_fee || 0) -
      totalHppSnapshotSum)
    : 0;

  return (
    <>
      <Head title="Data Transaksi" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        <div className="flex items-center justify-between">
          <Heading
            title="Riwayat Transaksi"
            description="Manajemen data penjualan semua marketplace."
          />
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Upload className="h-4 w-4" /> Import Excel
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Pilih Jenis Import</p>
                </div>
                <div className="px-2 py-2">
                  <Select value={shopeeStoreId} onValueChange={setShopeeStoreId}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Pilih Toko" />
                    </SelectTrigger>
                    <SelectContent>
                      {storesList?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.platform})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuItem onClick={triggerShopeeUpload} disabled={shopeeUploadProcessing} className="cursor-pointer">
                  <FileSpreadsheet className={`h-4 w-4 ${shopeeUploadProcessing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
                  <span>{shopeeUploadProcessing ? 'Mengimpor...' : 'Pesanan (.xlsx)'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={triggerStatusUpload} disabled={uploadProcessing} className="cursor-pointer">
                  <RefreshCw className={`h-4 w-4 ${uploadProcessing ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
                  <span>{uploadProcessing ? 'Mengompilasi...' : 'Status (.xlsx)'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file inputs */}
            <input
              ref={shopeeFileInputRef}
              type="file"
              id="shopee-import-upload"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleShopeeImport}
              disabled={shopeeUploadProcessing}
            />
            <input
              ref={statusFileInputRef}
              type="file"
              id="excel-status-upload"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleExcelUpload}
              disabled={uploadProcessing}
            />

            <Sheet open={isCreateSheetOpen} onOpenChange={(open) => {
              setIsCreateSheetOpen(open);
              if (!open) resetForm();
            }}>
              <Button onClick={() => setIsCreateSheetOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Transaksi Manual
              </Button>

              <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0">
                <SheetHeader className="p-6 pb-0">
                  <SheetTitle>Tambah Transaksi Manual</SheetTitle>
                  <SheetDescription>Catat pesanan penjualan baru dari platform toko e-commerce Anda.</SheetDescription>
                </SheetHeader>

                <Form
                  key={`add-transaction-form-${formKey}`}
                  {...TransactionController.store.form()}
                  options={{ preserveScroll: true }}
                  onSuccess={() => {
                    if (submitAction === 'save_close') {
                      setIsCreateSheetOpen(false);
                      resetForm();
                      setFormKey((prev) => prev + 1);
                    } else {
                      // Hanya reset nomor invoice agar daftar item produk bertahan
                      setInvoiceNumber('');

                      // =========================================================
                      // PERBAIKAN: Paksa set ulang tanggal ke jam dan detik waktu sekarang
                      // =========================================================
                      setTransactionDate(getLocalDatetimeString());

                      // Auto-Focus kembali ke kolom No. Pesanan
                      setTimeout(() => {
                        invoiceInputRef.current?.focus();
                      }, 100);
                    }
                  }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  {({ processing, errors }) => (
                    <>
                      <div className="grid flex-1 auto-rows-min gap-5 px-6 py-4 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Pilih Toko */}
                          <div className="grid gap-1.5">
                            <Label htmlFor="store_id">Toko Asal</Label>
                            <Select value={storeId} onValueChange={setStoreId}>
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue placeholder="Pilih Toko" />
                              </SelectTrigger>
                              <SelectContent>
                                {storesList?.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.platform})</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="store_id" value={storeId} />
                            <InputError message={errors.store_id} />
                          </div>

                          {/* No Invoice */}
                          <div className="grid gap-1.5">
                            <Label htmlFor="invoice_number">No. Pesanan</Label>
                            <Input
                              ref={invoiceInputRef}
                              id="invoice_number"
                              name="invoice_number"
                              placeholder="Contoh: 260001247..."
                              className="bg-background font-semibold"
                              required
                              value={invoiceNumber}
                              onChange={(e) => setInvoiceNumber(e.target.value)}
                            />
                            <InputError message={errors.invoice_number} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Status */}
                          <div className="grid gap-1.5">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                              <SelectTrigger className="w-full bg-background">
                                <SelectValue placeholder="Pilih Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completed">Selesai</SelectItem>
                                <SelectItem value="processing">Diproses</SelectItem>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" name="status" value={status} />
                            <InputError message={errors.status} />
                          </div>

                          {/* Tanggal & Waktu Akurat */}
                          <div className="grid gap-1.5">
                            <Label htmlFor="transaction_date">Tanggal & Waktu</Label>
                            <Input
                              id="transaction_date"
                              name="transaction_date"
                              type="datetime-local"
                              className="bg-background"
                              required
                              value={transactionDate}
                              onChange={(e) => setTransactionDate(e.target.value)}
                            />
                            <InputError message={errors.transaction_date} />
                          </div>
                        </div>

                        {/* Potongan Diskon */}
                        <div className="grid gap-1.5">
                          <Label htmlFor="discount">Diskon Bersama (Rp)</Label>
                          <Input
                            id="discount_display"
                            type="text"
                            placeholder="0"
                            value={displayDiscount}
                            onChange={(e) => handleDiscountChange(e.target.value)}
                            className="bg-background"
                          />
                          <input type="hidden" name="discount" value={rawDiscount} />
                          <InputError message={errors.discount} />
                        </div>

                        {/* Potongan Komisi Affiliate */}
                        <div className="grid gap-1.5">
                          <Label htmlFor="affiliate_fee_display">Komisi Affiliate (Rp) <span className="text-muted-foreground text-[10px]">(Jika ada)</span></Label>
                          <Input
                            id="affiliate_fee_display"
                            type="text"
                            placeholder="0"
                            value={displayAffiliate}
                            onChange={(e) => handleAffiliateChange(e.target.value)}
                            className="bg-background"
                          />
                          <input type="hidden" name="affiliate_fee" value={rawAffiliate} />
                          <InputError message={errors.affiliate_fee} />
                        </div>

                        {/* Bagian Entri Produk Bersifat Dinamis */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <Label className="text-sm font-semibold">Daftar Item Produk</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs gap-1">
                              <Plus className="h-3 w-3" /> Tambah Baris
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {items.map((item, index) => {
                              const activeProduct = productsList.find((p: any) => p.id.toString() === item.product_id.toString());
                              const productLabel = activeProduct ? activeProduct.name : 'Cari & Pilih Produk...';

                              return (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/10 relative group">

                                  {/* FIX SEMPURNA: SEARCHABLE DROPDOWN DENGAN RADIX PORTAL */}
                                  <div className="col-span-6 grid gap-1.5 relative">
                                    <Label className="text-[11px] text-muted-foreground">Produk</Label>

                                    <DropdownMenu
                                      open={openProductSearchIndex === index}
                                      onOpenChange={(open) => {
                                        if (open) {
                                          // Dipicu saat dropdown mau dibuka
                                          setOpenProductSearchIndex(index);
                                          setProductSearchQuery('');
                                        } else {
                                          // Dipicu saat dropdown mau ditutup (click outside atau klik trigger lagi)
                                          setOpenProductSearchIndex(null);
                                        }
                                      }}
                                    >
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="w-full bg-background justify-between font-normal text-left truncate h-9 px-3 border border-input text-xs"
                                        >
                                          <span className="truncate">{productLabel}</span>
                                          <Search className="h-3 w-3 shrink-0 opacity-50 ml-2" />
                                        </Button>
                                      </DropdownMenuTrigger>

                                      {/* Content ini menggunakan Portal secara otomatis sehingga melayang sempurna di atas kontainer scroll */}
                                      <DropdownMenuContent
                                        align="start"
                                        className="w-[var(--radix-dropdown-menu-trigger-width)] p-2 flex flex-col gap-1.5 max-h-60 overflow-hidden z-[100]"
                                      >
                                        {/* Kolom input cari di dalam dropdown */}
                                        <div className="relative" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                                          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                          <Input
                                            ref={productInputRef}
                                            placeholder="Ketik kata kunci produk..."
                                            className="h-8 pl-8 text-xs bg-background"
                                            value={productSearchQuery}
                                            onChange={(e) => setProductSearchQuery(e.target.value)}
                                          />
                                        </div>

                                        {/* Opsi Item Produk */}
                                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 text-xs max-h-40 no-scrollbar">
                                          {productsList
                                            ?.filter((p: any) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                            .map((p: any) => (
                                              <DropdownMenuItem
                                                key={p.id}
                                                className={`w-full text-left px-2 py-1.5 rounded cursor-pointer ${item.product_id === p.id.toString() ? 'bg-accent font-semibold text-accent-foreground' : ''}`}
                                                onSelect={() => {
                                                  handleItemChange(index, 'product_id', p.id.toString());
                                                  setOpenProductSearchIndex(null);
                                                }}
                                              >
                                                {p.name}
                                              </DropdownMenuItem>
                                            ))}
                                          {productsList?.filter((p: any) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                                            <div className="text-[11px] text-muted-foreground text-center py-3">Produk tidak ditemukan</div>
                                          )}
                                        </div>
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <input type="hidden" name={`items[${index}][product_id]`} value={item.product_id} />
                                  </div>

                                  <div className="col-span-2 grid gap-1.5">
                                    <Label className="text-[11px] text-muted-foreground">Qty</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        // Jika dikosongkan, biarkan kosong dulu di state agar bisa diketik ulang
                                        handleItemChange(index, 'quantity', val === '' ? '' : (parseInt(val) || 1));
                                      }}
                                      name={`items[${index}][quantity]`}
                                      className="bg-background px-2 text-xs h-9"
                                      required
                                    />
                                  </div>

                                  <div className="col-span-3 grid gap-1.5">
                                    <Label className="text-[11px] text-muted-foreground">Harga Jual (Rp)</Label>
                                    <Input
                                      type="text"
                                      placeholder="0"
                                      value={item.display_selling_price || ''}
                                      onChange={(e) => handleItemChange(index, 'selling_price', e.target.value)}
                                      className="bg-background px-2 text-xs h-9"
                                      required
                                    />
                                    <input type="hidden" name={`items[${index}][selling_price]`} value={item.selling_price} />
                                  </div>

                                  <div className="col-span-1 flex justify-center pb-1">
                                    <Button type="button" variant="ghost" size="icon" disabled={items.length === 1} onClick={() => handleRemoveItem(index)} className="text-destructive size-8 hover:bg-destructive/10">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {errors[`items.${index}.quantity`] && (
                                    <div className="col-span-12 mt-1">
                                      <InputError message={errors[`items.${index}.quantity`]} />
                                    </div>
                                  )}
                                  {errors[`items.${index}.product_id`] && (
                                    <div className="col-span-12 mt-1">
                                      <InputError message={errors[`items.${index}.product_id`]} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <SheetFooter className="p-6 border-t bg-background mt-auto flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Button
                          type="submit"
                          disabled={processing}
                          onClick={() => setSubmitAction('save_close')}
                          className="w-full sm:w-auto"
                        >
                          {processing && submitAction === 'save_close' ? 'Menyimpan...' : 'Simpan Transaksi'}
                        </Button>

                        <Button
                          type="submit"
                          variant="outline"
                          disabled={processing}
                          onClick={() => setSubmitAction('save_another')}
                          className="w-full sm:w-auto border border-input bg-background hover:bg-accent text-accent-foreground"
                        >
                          {processing && submitAction === 'save_another' ? 'Menyimpan...' : 'Simpan & Buat Lagi'}
                        </Button>

                        <SheetClose asChild>
                          <Button variant="outline" type="button" disabled={processing} className="w-full sm:w-auto">
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

        {/* ================= TABS FILTER BARU ================= */}
        <div className="flex w-full justify-center my-4">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-auto"
          >
            <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted/50 p-1.5 gap-1.5 backdrop-blur-sm border border-border/50">

              <TabsTrigger value="all" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground transition-all duration-200">
                <ShoppingBag className="h-4 w-4" />
                Semua
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-semibold bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-full">
                  {countAll}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="pending" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground transition-all duration-200">
                <Package className="h-4 w-4" />
                Perlu Dikirim
                <Badge className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500 text-white rounded-full">
                  {countPending}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="processing" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground transition-all duration-200">
                <Truck className="h-4 w-4" />
                Dikirim
                <Badge className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500 text-white rounded-full">
                  {countProcessing}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="completed" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground transition-all duration-200">
                <CheckCircle className="h-4 w-4" />
                Selesai
                <Badge className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500 text-white rounded-full">
                  {countCompleted}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="cancelled" className="gap-2 px-4 py-2 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground transition-all duration-200">
                <XCircle className="h-4 w-4" />
                Gagal / Batal
                <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-semibold rounded-full">
                  {countCancelled}
                </Badge>
              </TabsTrigger>

            </TabsList>
          </Tabs>
        </div>

        {/* BARIS SEKSI FILTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Semua Toko" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {storesList?.map((store: any) => <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {(search !== '' || storeFilter !== 'all') && (
              <Button
                variant="ghost"
                type="button"
                onClick={handleResetFilter}
                className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Reset
              </Button>
            )}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Cari No. Pesanan atau Produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* LOGIKA SINKRONISASI SKELETON LOADER HALAMAN TRANSAKSI */}
        {isLoading ? (
          <TransactionsTableSkeleton />
        ) : (
          /* TABEL DATA UTAMA ASLI */
          <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
            <div className="p-6">
              <Table>
                <TableCaption className='py-6'>Arsip rekaman penjualan masuk produk omnichannel Anda.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={transactions.data.length > 0 && selectedIds.length === transactions.data.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Gambar</TableHead>
                    <TableHead>Tanggal Transaksi</TableHead>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Toko / Platform</TableHead>
                    <TableHead>Total Bayar</TableHead>
                    <TableHead>Biaya Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon"><ShoppingBag /></EmptyMedia>
                            <EmptyTitle>Tidak Ada Transaksi</EmptyTitle>
                            <EmptyDescription>Belum ada rekaman transaksi terdata.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.data.map((tx: any, index: number) => {
                      const isSelected = selectedIds.includes(tx.id);
                      const firstProductImage = tx.items?.[0]?.product?.image;

                      return (
                        <TableRow
                          key={tx.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/70 ${isSelected ? 'bg-muted/60 hover:bg-muted/60' : index % 2 === 1 ? 'bg-muted/25' : 'bg-background'}`}
                          onClick={() => {
                            setSelectedTransaction(tx);
                            setIsSheetOpen(true);
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectRow(tx.id, !!checked)}
                              aria-label={`Select row ${tx.invoice_number}`}
                            />
                          </TableCell>

                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {firstProductImage ? (
                              <HoverCard openDelay={0} closeDelay={0}>
                                <HoverCardTrigger asChild>
                                  <div className="w-12 h-12 rounded-sm overflow-hidden border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                    <img src={firstProductImage} alt="Product Preview" className="w-full h-full object-cover" />
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent side="right" align="center" sideOffset={12} className="w-48 p-1.5 bg-background border shadow-xl rounded-lg pointer-events-none">
                                  <div className="w-full aspect-square overflow-hidden rounded-sm">
                                    <img src={firstProductImage} alt="Preview Besar" className="w-full h-full object-cover" />
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border text-muted-foreground/60">
                                <Box className="h-4 w-4" />
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-xs text-foreground">
                                {formatDateTime(tx.transaction_date).dateStr}
                              </span>
                              <span className="text-[10px] text-muted-foreground italic">
                                Pukul {formatDateTime(tx.transaction_date).timeStr} WIB
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            <div className="flex items-center">
                              <span>{tx.invoice_number}</span>
                              <CopyButton value={tx.invoice_number} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{tx.store?.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{tx.store?.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-xs">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.grand_total)}
                          </TableCell>
                          <TableCell className="text-xs text-destructive font-medium">
                            -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.marketplace_admin_fee)}
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                              setSelectedTransaction(tx);
                              setIsSheetOpen(true);
                            }}>
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {transactions.last_page > 1 && (
                <div className="flex items-center justify-between px-2 py-4 border-t border-sidebar-border/50 dark:border-sidebar-border">
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Menampilkan {transactions.from ?? 0} sampai {transactions.to ?? 0} dari {transactions.total ?? 0} transaksi
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactions.prev_page_url}
                      onClick={() => transactions.prev_page_url && router.get(transactions.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                    >
                      Sebelumnya
                    </Button>
                    <div className="text-xs md:text-sm font-medium px-2">
                      Hal {transactions.current_page} dari {transactions.last_page}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactions.next_page_url}
                      onClick={() => transactions.next_page_url && router.get(transactions.next_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
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

      {/* FLOATING ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/4 z-50 flex items-center gap-4 rounded-full border bg-background/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
            <strong className="text-foreground font-semibold">{selectedIds.length}</strong> transaksi terpilih
          </span>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="rounded-full text-xs h-8">
              Batal
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs h-8 border-blue-600/30 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Ubah Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg">
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('processing')} className="gap-2 cursor-pointer text-xs">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Diproses (Dikirim)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')} className="gap-2 cursor-pointer text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Selesai (Completed)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('pending')} className="gap-2 cursor-pointer text-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Menunggu (Pending)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('cancelled')} className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Dibatalkan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              className="rounded-full gap-1.5 text-xs h-8 border-emerald-600/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white"
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
                  Hapus Massal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sebanyak <strong className="text-foreground font-semibold">{selectedIds.length} data transaksi</strong> terpilih akan dihapus permanen dari basis data sistem.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleBulkDelete}>
                    Hapus Sekaligus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* DETAIL TRANSAKSI SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Rincian Transaksi</SheetTitle>
            <SheetDescription>Detail manifestasi item pesanan beserta snapshot kalkulasi keuntungan bersih finansial.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
            {selectedTransaction && (
              <>
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-muted/20">
                  <div className="grid gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">No. Invoice</span>
                    <span className="font-mono font-bold text-sm flex items-center">
                      {selectedTransaction.invoice_number}
                      <CopyButton value={selectedTransaction.invoice_number} />
                    </span>
                  </div>
                  <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Toko / Platform</span><span className="text-sm font-semibold">{selectedTransaction.store?.name} <span className="text-xs text-muted-foreground uppercase">({selectedTransaction.store?.platform})</span></span></div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">Waktu Pembayaran</span>
                    <span className="text-xs font-medium">
                      {formatDateTime(selectedTransaction.transaction_date).dateStr} - {formatDateTime(selectedTransaction.transaction_date).timeStr}
                    </span>
                  </div>
                  <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Status Riil</span><div>{getStatusBadge(selectedTransaction.status)}</div></div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Perbarui Status Transaksi Ini</Label>
                  <Select
                    defaultValue={selectedTransaction.status}
                    onValueChange={(newStatus) => {
                      router.patch(`/finance/transactions/${selectedTransaction.id}/status`, { status: newStatus });
                    }}
                  >
                    <SelectTrigger className="w-full text-xs h-9">
                      <SelectValue placeholder="Ubah Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Diproses (Dikirim)</SelectItem>
                      <SelectItem value="completed">Selesai (Completed)</SelectItem>
                      <SelectItem value="pending">Menunggu (Pending)</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground">Daftar Item Dibeli ({selectedTransaction.items?.length || 0})</span>
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-[11px] h-9">Nama Produk</TableHead>
                          <TableHead className="text-[11px] text-center h-9">Qty</TableHead>
                          <TableHead className="text-[11px] text-right h-9">Harga Satuan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTransaction.items?.map((item: any) => (
                          <TableRow key={item.id} className="hover:bg-transparent">
                            <TableCell className="py-2.5">
                              <div className="flex flex-col"><span className="text-xs font-semibold text-foreground">{item.product?.name || 'Produk Terhapus'}</span><span className="text-[10px] font-mono text-muted-foreground">{item.product?.sku || '-'}</span></div>
                            </TableCell>
                            <TableCell className="text-center text-xs py-2.5">{item.quantity} pcs</TableCell>
                            <TableCell className="text-right text-xs font-medium py-2.5">Rp {parseFloat(item.selling_price).toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="border p-4 rounded-xl bg-card space-y-2.5 text-xs">
                  <span className="text-xs font-bold text-foreground block border-b pb-1.5">Ringkasan Beban & Laba Finansial</span>
                  <div className="flex justify-between"><span>Potongan Diskon Global:</span><span>Rp {parseFloat(selectedTransaction.discount).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-2"><span>Grand Total Payout (Omzet):</span><span className="text-foreground">Rp {parseFloat(selectedTransaction.grand_total).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-red-600 dark:text-red-400"><span>Potongan Admin Platform Riil:</span><span>-Rp {parseFloat(selectedTransaction.marketplace_admin_fee).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-orange-600"><span>Beban Komisi Affiliate:</span><span>-Rp {parseFloat(selectedTransaction.affiliate_fee || 0).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-amber-600"><span>Total Beban HPP Snapshot:</span><span>-Rp {totalHppSnapshotSum.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between font-extrabold text-sm border-t border-dashed mt-2 pt-2"><span>Profit Bersih Riil (Netto):</span><span className={netProfitCalculated >= 0 ? 'text-emerald-600' : 'text-destructive'}>Rp {netProfitCalculated.toLocaleString('id-ID')}</span></div>
                </div>
              </>
            )}
          </div>
          <div className="p-6 border-t bg-background mt-auto"><SheetClose asChild><Button variant="outline" className="w-full">Tutup Detail</Button></SheetClose></div>
        </SheetContent>
      </Sheet>
    </>
  );
}

Transactions.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Riwayat Transaksi', href: TransactionController.index() },
  ],
};
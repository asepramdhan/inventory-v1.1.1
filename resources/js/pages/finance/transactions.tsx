/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, router } from '@inertiajs/react';
import { Box, Check, Copy, EyeIcon, FileSpreadsheet, Package, Plus, RefreshCw, Search, ShoppingBag, Trash2, Truck, XCircle, CheckCircle, MoreVertical, Upload, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TransactionController from '@/actions/App/Http/Controllers/TransactionController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';

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
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 animate-pulse">
      <div className="p-0">
        <Table>
          <TableCaption className='py-6 text-zinc-400 dark:text-zinc-500'>Arsip rekaman penjualan masuk produk omnichannel Anda.</TableCaption>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
            <TableRow>
              <TableHead className="w-[50px]"><div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded" /></TableHead>
              <TableHead className="text-xs">Gambar</TableHead>
              <TableHead className="text-xs">Tanggal Transaksi</TableHead>
              <TableHead className="text-xs">No. Pesanan</TableHead>
              <TableHead className="text-xs">Produk</TableHead>
              <TableHead className="text-xs">Toko / Platform</TableHead>
              <TableHead className="text-xs">Total Bayar</TableHead>
              <TableHead className="text-xs">Biaya Admin</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4].map((i) => (
              <TableRow key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                <TableCell><div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded" /></TableCell>
                <TableCell>
                  <div className="w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700 border" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-24" />
                  </div>
                </TableCell>
                 <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-28" />
                    <div className="h-5 w-5 bg-zinc-100 dark:bg-zinc-800 rounded" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-850 rounded w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
                    <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-14" />
                  </div>
                </TableCell>
                <TableCell><div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-20" /></TableCell>
                <TableCell><div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-16" /></TableCell>
                <TableCell><div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-16" /></TableCell>
                <TableCell className="text-right">
                  <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 rounded-lg ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Panel Navigasi Halaman Palsu */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-100 dark:border-zinc-800/60 mt-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-52" />
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-xl w-20" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-16" />
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded-xl w-20" />
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

  const [startDate, setStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tx_filter_start_date') || filters.start_date || '';
    }
    return filters.start_date || '';
  });

  const [endDate, setEndDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tx_filter_end_date') || filters.end_date || '';
    }
    return filters.end_date || '';
  });

  const [datePreset, setDatePreset] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedStart = localStorage.getItem('tx_filter_start_date') || filters.start_date || '';
      const storedEnd = localStorage.getItem('tx_filter_end_date') || filters.end_date || '';
      
      if (!storedStart && !storedEnd) return 'all';
      
      const todayStr = new Date().toISOString().split('T')[0];
      if (storedStart === todayStr && storedEnd === todayStr) return 'today';
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (storedStart === yesterdayStr && storedEnd === yesterdayStr) return 'yesterday';
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      if (storedStart === sevenDaysAgoStr && storedEnd === todayStr) return '7_days';

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      if (storedStart === thirtyDaysAgoStr && storedEnd === todayStr) return '30_days';

      const firstOfMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      if (storedStart === firstOfMonthStr && storedEnd === todayStr) return 'this_month';

      return 'custom';
    }
    return 'all';
  });

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const formatted = formatDate(today);
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (preset === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const formatted = formatDate(yesterday);
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (preset === '7_days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === '30_days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(today));
    }
  };

  // Efek untuk menyimpan filter transaksi ke localStorage saat ada perubahan
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tx_filter_search', search);
      localStorage.setItem('tx_filter_store', storeFilter);
      localStorage.setItem('tx_filter_status', statusFilter);
      localStorage.setItem('tx_filter_start_date', startDate);
      localStorage.setItem('tx_filter_end_date', endDate);
    }
  }, [search, storeFilter, statusFilter, startDate, endDate]);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // REFS UNTUK AUTO FOCUS
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Efek Pintasan Keyboard (Hotkeys) untuk operasional cepat (satset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputActive = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable;
      
      if (isInputActive) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsCreateSheetOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const [barcodeInput, setBarcodeInput] = useState('');

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = barcodeInput.trim();
      if (!query) return;

      const product = productsList.find(
        (p: any) => p.sku && p.sku.toLowerCase() === query.toLowerCase()
      );

      if (product) {
        const existingIndex = items.findIndex(
          (item) => item.product_id.toString() === product.id.toString()
        );

        if (existingIndex !== -1) {
          const updatedItems = [...items];
          const currentQty = updatedItems[existingIndex].quantity;
          updatedItems[existingIndex].quantity = (typeof currentQty === 'number' ? currentQty : parseInt(currentQty) || 0) + 1;
          setItems(updatedItems);
        } else {
          const basePrice = product.price ? Math.round(product.price).toString() : '0';
          const displayPrice = product.price
            ? new Intl.NumberFormat('id-ID').format(product.price)
            : '0';

          if (items.length === 1 && items[0].product_id === '') {
            setItems([
              {
                product_id: product.id.toString(),
                quantity: 1,
                selling_price: basePrice,
                display_selling_price: displayPrice
              }
            ]);
          } else {
            setItems([
              ...items,
              {
                product_id: product.id.toString(),
                quantity: 1,
                selling_price: basePrice,
                display_selling_price: displayPrice
              }
            ]);
          }
        }
        setBarcodeInput('');
      } else {
        alert(`Produk dengan SKU "${query}" tidak ditemukan.`);
      }
    }
  };

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
    if (openProductSearchIndex !== null) {
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

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      router.get(
        TransactionController.index(),
        { search, store_id: storeFilter, status: statusFilter, start_date: startDate, end_date: endDate },
        { preserveState: true, replace: true }
      );
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, storeFilter, statusFilter, startDate, endDate]);

  const handleResetFilter = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tx_filter_search');
      localStorage.removeItem('tx_filter_store');
      localStorage.removeItem('tx_filter_status');
      localStorage.removeItem('tx_filter_start_date');
      localStorage.removeItem('tx_filter_end_date');
    }
    setSearch('');
    setStoreFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
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
          if (e.target) e.target.value = '';
        },
        onError: (err: any) => {
          setUploadProcessing(false);
          toast.error(err.file || 'Gagal mengupload file Excel.');
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
          toast.error(err.file || 'Gagal mengimpor pesanan.');
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
    setBarcodeInput('');
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
  const countAllOrders = statusCounts?.all?.count ?? 0;
  const countAllItems = statusCounts?.all?.items ?? 0;

  const countPendingOrders = statusCounts?.pending?.count ?? 0;
  const countPendingItems = statusCounts?.pending?.items ?? 0;

  const countProcessingOrders = statusCounts?.processing?.count ?? 0;
  const countProcessingItems = statusCounts?.processing?.items ?? 0;

  const countCompletedOrders = statusCounts?.completed?.count ?? 0;
  const countCompletedItems = statusCounts?.completed?.items ?? 0;

  const countCancelledOrders = statusCounts?.cancelled?.count ?? 0;
  const countCancelledItems = statusCounts?.cancelled?.items ?? 0;

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

  const liveSubtotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.selling_price) || 0;
    return acc + (qty * price);
  }, 0);

  const liveDiscount = Number(rawDiscount) || 0;
  const liveGrandTotal = Math.max(0, liveSubtotal - liveDiscount);

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
                <Button variant="outline" className="gap-1.5" disabled={shopeeUploadProcessing || uploadProcessing}>
                  {shopeeUploadProcessing || uploadProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                      Proses Impor...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Import Excel
                    </>
                  )}
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
                <div className="border-t my-1" />
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-blue-500" />
                    <span>Info Format Kolom:</span>
                  </div>
                  <div>
                    <strong className="text-foreground">Shopee:</strong> No. Pesanan, Status Pesanan, SKU Induk, Harga Setelah Diskon, Jumlah, Subtotal Pesanan
                  </div>
                  <div className="mt-0.5">
                    <strong className="text-foreground">Status:</strong> No. Pesanan, Status Pesanan
                  </div>
                </div>
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

                          <div className="grid gap-1.5 pb-2">
                            <Label htmlFor="barcode_scan" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                              <Package className="h-3.5 w-3.5 text-primary" />
                              Scan Barcode / Ketik SKU Produk
                            </Label>
                            <Input
                              id="barcode_scan"
                              placeholder="Ketik SKU lalu tekan Enter..."
                              value={barcodeInput}
                              onChange={(e) => setBarcodeInput(e.target.value)}
                              onKeyDown={handleBarcodeScan}
                              className="bg-background font-mono text-xs focus-visible:ring-emerald-500 h-9"
                            />
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
                                            ?.filter((p: any) => 
                                              p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                              (p.sku && p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                            )
                                            .map((p: any) => {
                                              const isOutOfStock = p.stock <= 0;
                                              return (
                                                <DropdownMenuItem
                                                  key={p.id}
                                                  disabled={isOutOfStock}
                                                  className={`w-full text-left px-2 py-1.5 rounded cursor-pointer flex justify-between items-center gap-2 ${item.product_id === p.id.toString() ? 'bg-accent font-semibold text-accent-foreground' : ''} ${isOutOfStock ? 'opacity-50 cursor-not-allowed text-destructive' : ''}`}
                                                  onSelect={() => {
                                                    if (isOutOfStock) return;
                                                    handleItemChange(index, 'product_id', p.id.toString());
                                                    setOpenProductSearchIndex(null);
                                                  }}
                                                >
                                                  <div className="flex flex-col min-w-0">
                                                    <span className="font-medium truncate">{p.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{p.sku || '-'}</span>
                                                  </div>
                                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${isOutOfStock ? 'bg-red-500/10 text-red-600 border border-red-500/20' : p.stock < 5 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                                                    {isOutOfStock ? 'Habis' : `Stok: ${p.stock}`}
                                                  </span>
                                                </DropdownMenuItem>
                                              );
                                            })}
                                          {productsList?.filter((p: any) => 
                                            p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                            (p.sku && p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                          ).length === 0 && (
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
                                      className={`bg-background px-2 text-xs h-9 ${activeProduct && item.quantity > activeProduct.stock ? 'border-destructive focus-visible:ring-destructive text-destructive font-semibold' : ''}`}
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

                                  {activeProduct && item.quantity > activeProduct.stock && (
                                    <div className="col-span-12 mt-1">
                                      <p className="text-[10px] text-red-600 font-semibold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">
                                        Stok tidak mencukupi! Sisa stok tersedia: {activeProduct.stock} pcs.
                                      </p>
                                    </div>
                                  )}
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

                        {/* Live Calculation Summary */}
                        <div className="p-4 border rounded-xl bg-muted/20 dark:bg-zinc-900/40 space-y-2.5 text-xs select-none shadow-inner">
                          <span className="text-xs font-bold text-foreground block border-b pb-1.5">Kalkulasi Live (Sebelum Disimpan)</span>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal Item:</span>
                            <span className="font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(liveSubtotal)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Potongan Diskon:</span>
                            <span className="text-destructive font-semibold">-{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(liveDiscount)}</span>
                          </div>
                          <div className="flex justify-between font-extrabold text-sm border-t border-dashed mt-2 pt-2">
                            <span className="text-foreground">Grand Total Payout:</span>
                            <span className="text-emerald-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(liveGrandTotal)}</span>
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

        {/* ================= KPI CARDS SUMMARY ================= */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 my-2">
          {/* Card 1: Total Produk */}
          <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-500 opacity-80 group-hover:h-1.5 transition-all duration-200" />
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Total Produk Terjual</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{countAllItems} <span className="text-xs font-normal text-zinc-450 dark:text-zinc-500">Pcs</span></p>
                <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Akumulasi kuantitas produk</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-zinc-650 dark:text-zinc-355 border border-zinc-150/50 dark:border-zinc-750/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Perlu Dikirim */}
          <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 opacity-80 group-hover:h-1.5 transition-all duration-200" />
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Perlu Dikirim</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{countPendingItems} <span className="text-xs font-normal text-zinc-450 dark:text-zinc-500">Pcs</span></p>
                <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Kuantitas produk belum dikirim</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-100/50 dark:border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Dikirim */}
          <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500 opacity-80 group-hover:h-1.5 transition-all duration-200" />
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Sedang Dikirim</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{countProcessingItems} <span className="text-xs font-normal text-zinc-450 dark:text-zinc-500">Pcs</span></p>
                <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Kuantitas produk dalam transit</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-450 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Truck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Selesai */}
          <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-80 group-hover:h-1.5 transition-all duration-200" />
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">Selesai</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{countCompletedItems} <span className="text-xs font-normal text-zinc-450 dark:text-zinc-500">Pcs</span></p>
                <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500">Kuantitas produk sukses diterima</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= TABS FILTER BARU ================= */}
        <div className="flex w-full justify-center my-4 overflow-x-auto no-scrollbar">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-auto"
          >
            <TabsList className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/40 p-1 gap-1 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/80">

              <TabsTrigger value="all" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <ShoppingBag className="h-3.5 w-3.5 text-zinc-500" />
                Semua
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-zinc-200/60 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-full">
                  {countAllOrders}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="pending" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <Package className="h-3.5 w-3.5 text-amber-500" />
                Perlu Dikirim
                <Badge className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {countPendingOrders}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="processing" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <Truck className="h-3.5 w-3.5 text-blue-500" />
                Dikirim
                <Badge className="px-2 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                  {countProcessingOrders}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="completed" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                Selesai
                <Badge className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                  {countCompletedOrders}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="cancelled" className="gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-zinc-50 dark:text-zinc-400 transition-all duration-200 cursor-pointer">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                Gagal / Batal
                <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-bold rounded-full">
                  {countCancelledOrders}
                </Badge>
              </TabsTrigger>

            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

            <Select value={datePreset} onValueChange={applyDatePreset}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                <SelectValue placeholder="Semua Waktu" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="7_days">7 Hari Terakhir</SelectItem>
                <SelectItem value="30_days">30 Hari Terakhir</SelectItem>
                <SelectItem value="this_month">Bulan Ini</SelectItem>
                <SelectItem value="custom">Kustom Tanggal</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl px-3 h-10 animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="bg-transparent border-0 p-0 text-xs focus:outline-none focus:ring-0 w-[115px] outline-none h-auto"
                />
                <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="bg-transparent border-0 p-0 text-xs focus:outline-none focus:ring-0 w-[115px] outline-none h-auto"
                />
              </div>
            )}

            {(search !== '' || storeFilter !== 'all' || startDate !== '' || endDate !== '') && (
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

          <div className="relative w-full sm:w-80 lg:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Cari No. Pesanan... (Tekan '/' untuk fokus)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80"
            />
          </div>
        </div>

        {/* LOGIKA SINKRONISASI SKELETON LOADER HALAMAN TRANSAKSI */}
        {isLoading ? (
          <TransactionsTableSkeleton />
        ) : (
          /* TABEL DATA UTAMA ASLI */
          <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 md:min-h-min shadow-sm">
            <div className="p-0">
              <Table>
                <TableCaption className='py-6 text-zinc-400 dark:text-zinc-500'>Arsip rekaman penjualan masuk produk omnichannel Anda.</TableCaption>
                <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={transactions.data.length > 0 && selectedIds.length === transactions.data.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="text-xs">Gambar</TableHead>
                    <TableHead className="text-xs">Tanggal Transaksi</TableHead>
                    <TableHead className="text-xs">No. Pesanan</TableHead>
                    <TableHead className="text-xs">Produk</TableHead>
                    <TableHead className="text-xs">Toko / Platform</TableHead>
                    <TableHead className="text-xs">Total Bayar</TableHead>
                    <TableHead className="text-xs">Biaya Admin</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
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
                    (() => {
                      const rows: any[] = [];
                      transactions.data.forEach((tx: any) => {
                        const items = tx.items || [];
                        if (items.length === 0) {
                          rows.push({ tx, item: null, key: `tx-${tx.id}` });
                        } else {
                          items.forEach((item: any, idx: number) => {
                            rows.push({ tx, item, key: `tx-${tx.id}-item-${item.id || idx}` });
                          });
                        }
                      });

                      return rows.map(({ key, tx, item }: any) => {
                        const isSelected = selectedIds.includes(tx.id);
                        const productImage = item?.product?.image;

                        return (
                          <TableRow
                            key={key}
                            className={`cursor-pointer transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${isSelected ? 'bg-zinc-50/60 dark:bg-zinc-800/40' : ''}`}
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
                              {productImage ? (
                                <HoverCard openDelay={0} closeDelay={0}>
                                  <HoverCardTrigger asChild>
                                    <div className="w-12 h-12 rounded-sm overflow-hidden border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                      <img src={productImage} alt="Product Preview" className="w-full h-full object-cover" />
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent side="right" align="center" sideOffset={12} className="w-48 p-1.5 bg-background border shadow-xl rounded-lg pointer-events-none">
                                    <div className="w-full aspect-square overflow-hidden rounded-sm">
                                      <img src={productImage} alt="Preview Besar" className="w-full h-full object-cover" />
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
                              <div className="flex flex-col max-w-[200px]">
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                  {item ? item.product_name : '-'}
                                </span>
                                {item && (
                                  <span className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400">
                                    SKU: {item.product_sku || item.product?.sku || '-'} | Qty: {item.quantity}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-xs">{tx.store?.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{tx.store?.platform}</span>
                              </div>
                            </TableCell>

                            <TableCell className="font-bold text-xs">
                              {item ? (
                                <>
                                  <div>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.selling_price * item.quantity)}</div>
                                  <div className="text-[10px] font-normal text-muted-foreground">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.selling_price)} x{item.quantity}
                                  </div>
                                </>
                              ) : (
                                '-'
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-destructive font-medium">
                              -{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.marketplace_admin_fee)}
                            </TableCell>

                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="focus:outline-none select-none hover:opacity-80 active:scale-95 transition-all duration-150 cursor-pointer">
                                  {getStatusBadge(tx.status)}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44 rounded-xl shadow-lg z-[50]">
                                  <DropdownMenuItem
                                    onClick={() => router.patch(`/finance/transactions/${tx.id}/status`, { status: 'processing' }, { preserveScroll: true })}
                                    className="gap-2 cursor-pointer text-xs"
                                  >
                                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Diproses (Dikirim)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.patch(`/finance/transactions/${tx.id}/status`, { status: 'completed' }, { preserveScroll: true })}
                                    className="gap-2 cursor-pointer text-xs"
                                  >
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Selesai (Completed)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.patch(`/finance/transactions/${tx.id}/status`, { status: 'pending' }, { preserveScroll: true })}
                                    className="gap-2 cursor-pointer text-xs"
                                  >
                                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Menunggu (Pending)
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.patch(`/finance/transactions/${tx.id}/status`, { status: 'cancelled' }, { preserveScroll: true })}
                                    className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                                  >
                                    <span className="h-2 w-2 rounded-full bg-red-500" /> Dibatalkan
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>

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
                      });
                    })()
                  )}
                </TableBody>
              </Table>

              {transactions.last_page > 1 && (
                 <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-100 dark:border-zinc-800/60">
                   <div className="text-xs text-zinc-400 dark:text-zinc-500">
                     Menampilkan {transactions.from ?? 0} sampai {transactions.to ?? 0} dari {transactions.total ?? 0} transaksi
                   </div>
                   <div className="flex items-center space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       className="text-xs h-8 rounded-xl"
                       disabled={!transactions.prev_page_url}
                       onClick={() => transactions.prev_page_url && router.get(transactions.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                     >
                       Sebelumnya
                     </Button>
                     <div className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 px-1">
                       Hal {transactions.current_page} dari {transactions.last_page}
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       className="text-xs h-8 rounded-xl"
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

        {/* Ringkasan Jumlah Transaksi Per Toko (Sleek Summary Table) */}
        <div className="shadow-sm bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden mt-6">
          <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/55 dark:bg-zinc-800/30 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Ringkasan Transaksi Per Toko</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic hidden sm:inline">Klik baris toko untuk menyaring data</span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/20 dark:bg-zinc-800/10 text-zinc-500 dark:text-zinc-400 font-semibold">
                  <th className="p-3 pl-5">Nama Toko</th>
                  <th className="p-3 text-center">Platform</th>
                  <th className="p-3 text-center font-bold">Total Order</th>
                  <th className="p-3 text-center text-amber-600 dark:text-amber-400">Kirim</th>
                  <th className="p-3 text-center text-blue-600 dark:text-blue-400">Proses</th>
                  <th className="p-3 text-center text-emerald-600 dark:text-emerald-400">Selesai</th>
                  <th className="p-3 text-center text-red-600 dark:text-red-400">Batal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {/* Row: Semua Toko */}
                <tr 
                  onClick={() => setStoreFilter('all')}
                  className={`cursor-pointer transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${storeFilter === 'all' ? 'bg-blue-50/50 dark:bg-blue-950/20 font-semibold text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                >
                  <td className="p-3 pl-5 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${storeFilter === 'all' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-transparent'}`} />
                    Semua Toko
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      TOTAL
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">{countAllOrders}</td>
                  <td className="p-3 text-center font-mono text-amber-600 dark:text-amber-400">{countPendingOrders}</td>
                  <td className="p-3 text-center font-mono text-blue-600 dark:text-blue-400">{countProcessingOrders}</td>
                  <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400">{countCompletedOrders}</td>
                  <td className="p-3 text-center font-mono text-red-600 dark:text-red-400">{countCancelledOrders}</td>
                </tr>

                {/* Rows: Each Store */}
                {storesList?.map((store: any) => {
                  const isSelected = storeFilter === store.id.toString();
                  return (
                    <tr 
                      key={store.id}
                      onClick={() => setStoreFilter(store.id.toString())}
                      className={`cursor-pointer transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20 font-semibold text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                      <td className="p-3 pl-5 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-600 dark:bg-blue-400' : 'bg-transparent'}`} />
                        {store.name}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          {store.platform || 'manual'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">{store.transactions_count || 0}</td>
                      <td className="p-3 text-center font-mono text-amber-600 dark:text-amber-400">{store.pending_count || 0}</td>
                      <td className="p-3 text-center font-mono text-blue-600 dark:text-blue-400">{store.processing_count || 0}</td>
                      <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400">{store.completed_count || 0}</td>
                      <td className="p-3 text-center font-mono text-red-600 dark:text-red-400">{store.cancelled_count || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            <strong className="text-zinc-900 dark:text-zinc-50 font-bold">{selectedIds.length}</strong> transaksi terpilih
          </span>
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="rounded-full text-xs h-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Batal
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs h-8 border-blue-600/30 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white dark:border-blue-900/30 dark:text-blue-400 dark:bg-blue-950/20 dark:hover:bg-blue-600"
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
                  Hapus Massal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-zinc-500">
                    Sebanyak <strong className="text-zinc-950 dark:text-zinc-50 font-bold">{selectedIds.length} data transaksi</strong> terpilih akan dihapus permanen dari basis data sistem.
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
                              <div className="flex flex-col">
                                {item.product ? (
                                  <span
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setIsSheetOpen(false); // Tutup sheet detail terlebih dahulu
                                      const searchQuery = item.product.sku || item.product.name;
                                      router.get('/products', { search: searchQuery });
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                                  >
                                    {item.product.name}
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-foreground">Produk Terhapus</span>
                                )}
                                <span className="text-[10px] font-mono text-muted-foreground">{item.product?.sku || '-'}</span>
                              </div>
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

      {/* Premium Glassmorphism Import Overlay Loader */}
      {(shopeeUploadProcessing || uploadProcessing) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/20 bg-background/80 p-6 text-center shadow-2xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileSpreadsheet className="h-8 w-8 animate-bounce" />
                <span className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">
                  {shopeeUploadProcessing ? 'Mengimpor Pesanan Shopee' : 'Memperbarui Status Pesanan'}
                </h3>
                <p className="text-xs text-muted-foreground animate-pulse">
                  Sedang membaca berkas Excel & mensinkronisasi stok produk...
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Mencocokkan SKU database...
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Proses ini memerlukan waktu beberapa detik. Mohon jangan menutup halaman.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Transactions.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Riwayat Transaksi', href: TransactionController.index() },
  ],
};
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, router } from '@inertiajs/react';
import { Box, Check, Copy, EyeIcon, FileSpreadsheet, Package, Plus, RefreshCw, Search, ShoppingBag, Trash2, Truck, XCircle, CheckCircle, MoreVertical, Upload, Info, FileText, MessageCircle, Store, Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TransactionController from '@/actions/App/Http/Controllers/TransactionController';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
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
              <TableHead className="text-xs">Bukti Paket</TableHead>
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

export default function Transactions({ transactions, storesList, productsList, customersList = [], filters, statusCounts }: any) {
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
  const [customerId, setCustomerId] = useState<string>('');

  // Biteship Shipping States for Creation Form
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [courierCompany, setCourierCompany] = useState<string>('');
  const [courierType, setCourierType] = useState<string>('');
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);

  // Autocomplete states for Transaction Form destination area
  const [txBiteshipAreaId, setTxBiteshipAreaId] = useState('');
  const [txBiteshipAreaName, setTxBiteshipAreaName] = useState('');
  const [txAreaSearchQuery, setTxAreaSearchQuery] = useState('');
  const [txSearchResults, setTxSearchResults] = useState<any[]>([]);
  const [isSearchingTxAreas, setIsSearchingTxAreas] = useState(false);

  // Debounced subdistrict search for Transaction Form
  useEffect(() => {
    if (txAreaSearchQuery.length < 3) {
      setTxSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingTxAreas(true);
      try {
        const response = await fetch(`/api/biteship/search-areas?query=${encodeURIComponent(txAreaSearchQuery)}`);
        const data = await response.json();
        setTxSearchResults(data.areas || []);
      } catch (err) {
        console.error('Error fetching areas', err);
      } finally {
        setIsSearchingTxAreas(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [txAreaSearchQuery]);

  // Automatically sync/update Biteship Area if the selected customer changes
  useEffect(() => {
    if (customerId && customerId !== 'none') {
      const selectedCust = customersList.find((c: any) => c.id.toString() === customerId);
      if (selectedCust && selectedCust.biteship_area_id) {
        setTxBiteshipAreaId(selectedCust.biteship_area_id);
        setTxBiteshipAreaName(selectedCust.biteship_area_name || '');
      } else {
        setTxBiteshipAreaId('');
        setTxBiteshipAreaName('');
      }
    } else {
      setTxBiteshipAreaId('');
      setTxBiteshipAreaName('');
    }
    setAvailableCouriers([]);
    setShippingCost(0);
    setCourierCompany('');
    setCourierType('');
    setTxAreaSearchQuery('');
  }, [customerId]);

  // ==========================================
  // WHATSAPP ADDRESS PARSER FEATURE
  // ==========================================
  const [rawAddressPaste, setRawAddressPaste] = useState('');
  const [parsedDetails, setParsedDetails] = useState<{
    name: string;
    phone: string;
    address: string;
    subdistrict: string;
  } | null>(null);
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);

  const handleParseAddress = () => {
    if (!rawAddressPaste.trim()) {
      alert('Silakan tempel teks alamat terlebih dahulu.');
      return;
    }

    const text = rawAddressPaste;
    let nameVal = '';
    let phoneVal = '';
    let addressVal = '';
    let subdistrictVal = '';

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // 1. Extract phone number using regex
    const phoneRegex = /(?:no\.?\s*hp|telp|telepon|hp|phone|wa)\s*:?\s*(08[0-9]{8,12}|62[0-9]{8,12}|\+62[0-9]{8,12})/i;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(phoneRegex);
      if (match) {
        phoneVal = match[1];
        // Clean up line
        lines[i] = lines[i].replace(match[0], '').trim();
        break;
      }
    }

    // 2. Try to find labels like "Nama:", "Penerima:", "Kepada:"
    const nameRegex = /^(?:nama|penerima|kepada|penerima\s*paket|nama\s*penerima|nama\s*lengkap)\s*:?\s*(.+)$/i;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(nameRegex);
      if (match) {
        nameVal = match[1];
        lines.splice(i, 1);
        break;
      }
    }

    // 3. Try to find labels like "Alamat:", "Address:"
    const addressRegex = /^(?:alamat|alamat\s*lengkap|jalan|jl\.?)\s*:?\s*(.+)$/i;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(addressRegex);
      if (match) {
        addressVal = match[1];
        lines.splice(i, 1);
        break;
      }
    }

    // 4. Try to find labels like "Kecamatan:", "Kec:"
    const subdistrictRegex = /^(?:kecamatan|kec)\s*:?\s*(.+)$/i;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(subdistrictRegex);
      if (match) {
        subdistrictVal = match[1];
        lines.splice(i, 1);
        break;
      }
    }

    // 5. If name is still empty, look at the first line
    const remainingLines = lines.filter(line => line.replace(/[^a-zA-Z0-9]/g, '').trim().length > 0);
    if (!nameVal && remainingLines.length > 0) {
      const firstLine = remainingLines[0];
      if (!/\d/.test(firstLine) && firstLine.length < 40) {
        nameVal = firstLine;
        remainingLines.shift();
      }
    }

    // 6. If address is still empty, merge the remaining lines
    if (!addressVal && remainingLines.length > 0) {
      addressVal = remainingLines.join(', ');
    }

    // 7. Try to detect subdistrict from address text if not extracted explicitly
    if (!subdistrictVal && addressVal) {
      const kecMatch = addressVal.match(/(?:kecamatan|kec)\.?\s+([a-zA-Z\s\-]+)/i);
      if (kecMatch) {
        subdistrictVal = kecMatch[1].trim();
      }
    }

    // Normalize phone number (convert 62 / +62 to 08)
    if (phoneVal) {
      phoneVal = phoneVal.replace(/[^0-9]/g, '');
      if (phoneVal.startsWith('62')) {
        phoneVal = '0' + phoneVal.slice(2);
      }
    }

    // Clean up characters
    const cleanStr = (s: string) => s.trim().replace(/^[:\s\-–—,]+|[:\s\-–—,]+$/g, '');

    const parsed = {
      name: cleanStr(nameVal),
      phone: cleanStr(phoneVal),
      address: cleanStr(addressVal),
      subdistrict: cleanStr(subdistrictVal)
    };

    setParsedDetails(parsed);

    // Auto check if customer already exists in customersList (by phone number matching)
    if (parsed.phone && customersList) {
      const match = customersList.find((c: any) => c.phone && c.phone.replace(/[^0-9]/g, '') === parsed.phone.replace(/[^0-9]/g, ''));
      if (match) {
        setCustomerId(match.id.toString());
        toast.success(`Ditemukan pelanggan terdaftar: ${match.name}. Menghubungkan...`);
        return;
      }
    }

    // If subdistrict exists, trigger subdistrict search automatically for Biteship Area selection
    if (parsed.subdistrict) {
      setTxAreaSearchQuery(parsed.subdistrict);
      toast.info(`Mencari kecamatan: "${parsed.subdistrict}" di Biteship...`);
    }
  };

  // Find matching customer in React state
  const detectedCustomer = parsedDetails?.phone
    ? customersList?.find((c: any) => c.phone && c.phone.replace(/[^0-9]/g, '') === parsedDetails.phone.replace(/[^0-9]/g, ''))
    : null;

  const handleRegisterCustomerInline = () => {
    if (!parsedDetails || !parsedDetails.name) return;

    const tempDetails = parsedDetails; // Simpan salinan lokal sebelum state direset

    setIsRegisteringCustomer(true);
    router.post('/master-data/customers', {
      name: tempDetails.name,
      phone: tempDetails.phone || '',
      address: tempDetails.address || '',
      platform: 'manual',
      biteship_area_id: txBiteshipAreaId || '',
      biteship_area_name: txBiteshipAreaName || ''
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        setIsRegisteringCustomer(false);
        setRawAddressPaste('');
        setParsedDetails(null);

        // Cari ID pelanggan yang baru dibuat dari customersList yang sudah di-refresh
        const freshCustomers = page.props.customersList as any[];
        if (freshCustomers && tempDetails) {
          const matched = freshCustomers.find(
            (c: any) => c.phone && tempDetails.phone && c.phone.replace(/[^0-9]/g, '') === tempDetails.phone.replace(/[^0-9]/g, '')
          ) || freshCustomers.find(
            (c: any) => c.name && tempDetails.name && c.name.toLowerCase() === tempDetails.name.toLowerCase()
          );
          
          if (matched) {
            setCustomerId(matched.id.toString());
            toast.success(`Pelanggan baru berhasil didaftarkan dan dihubungkan!`);
          }
        }
      },
      onError: (err) => {
        setIsRegisteringCustomer(false);
        const errMsg = Object.values(err).join(', ');
        alert(`Gagal mendaftarkan pelanggan: ${errMsg}`);
      }
    });
  };

  // Biteship Shipping States for Selected Transaction Detail Sheet
  const [detailCourierCompany, setDetailCourierCompany] = useState('');
  const [detailCourierType, setDetailCourierType] = useState('');
  const [detailShippingCost, setDetailShippingCost] = useState<number>(0);
  const [detailAvailableCouriers, setDetailAvailableCouriers] = useState<any[]>([]);
  const [isDetailLoadingRates, setIsDetailLoadingRates] = useState(false);
  const [trackingDetails, setTrackingDetails] = useState<any>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  // Fetch Shipping Rates for Create Form
  const fetchShippingRates = async (areaId: string, itemsVal: any[]) => {
    if (!areaId) {
      alert('Harap cari dan pilih wilayah Kecamatan / Kelurahan tujuan pengiriman terlebih dahulu.');
      setAvailableCouriers([]);
      setShippingCost(0);
      setCourierCompany('');
      setCourierType('');
      return;
    }

    // Check if items are filled
    const validItems = itemsVal.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      alert('Harap pilih minimal satu produk dan tentukan jumlah kuantitasnya.');
      setAvailableCouriers([]);
      return;
    }

    setIsLoadingRates(true);
    try {
      const response = await fetch('/api/biteship/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
        },
        body: JSON.stringify({
          destination_area_id: areaId,
          items: validItems.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: parseInt(item.quantity)
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableCouriers(data.pricing || []);
      } else {
        alert('Gagal mendapatkan tarif ongkir dari Biteship.');
      }
    } catch (err) {
      console.error('Error fetching rates', err);
      alert('Terjadi kesalahan koneksi saat menghubungi Biteship.');
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Fetch Shipping Rates for Details Sheet
  const fetchDetailShippingRates = async () => {
    if (!selectedTransaction || !selectedTransaction.customer?.biteship_area_id) return;
    
    setIsDetailLoadingRates(true);
    try {
      const response = await fetch('/api/biteship/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
        },
        body: JSON.stringify({
          destination_area_id: selectedTransaction.customer.biteship_area_id,
          items: selectedTransaction.items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDetailAvailableCouriers(data.pricing || []);
      } else {
        alert('Gagal mengambil tarif ongkir Biteship.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghubungi API Biteship.');
    } finally {
      setIsDetailLoadingRates(false);
    }
  };

  // Fetch Live Tracking Status
  const fetchTrackingDetails = async () => {
    if (!selectedTransaction) return;
    setIsLoadingTracking(true);
    try {
      const response = await fetch(`/api/biteship/transactions/${selectedTransaction.id}/track`);
      if (response.ok) {
        const data = await response.json();
        setTrackingDetails(data);
      } else {
        alert('Gagal mengambil data pelacakan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat melacak paket.');
    } finally {
      setIsLoadingTracking(false);
    }
  };

  // Reset detail shipping rates when transaction shifts
  useEffect(() => {
    setDetailCourierCompany('');
    setDetailCourierType('');
    setDetailShippingCost(0);
    setDetailAvailableCouriers([]);
    setTrackingDetails(null);
  }, [selectedTransaction]);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      setIsCreateSheetOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
  const [isImportStoreModalOpen, setIsImportStoreModalOpen] = useState(false);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState<number>(0);

  // Reset selectedStoreIndex when modal opens
  useEffect(() => {
    if (isImportStoreModalOpen) {
      setSelectedStoreIndex(0);
    }
  }, [isImportStoreModalOpen]);

  // Keyboard navigation for store selection modal
  useEffect(() => {
    if (!isImportStoreModalOpen || !storesList || storesList.length === 0) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedStoreIndex((prev) => (prev + 1) % storesList.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedStoreIndex((prev) => (prev - 1 + storesList.length) % storesList.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeStore = storesList[selectedStoreIndex];
        if (activeStore) {
          setShopeeStoreId(activeStore.id.toString());
          setIsImportStoreModalOpen(false);
          setTimeout(() => {
            shopeeFileInputRef.current?.click();
          }, 150);
        }
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isImportStoreModalOpen, selectedStoreIndex, storesList]);

  // Auto-scroll when selectedStoreIndex changes to keep active item in view
  useEffect(() => {
    if (!isImportStoreModalOpen) return;
    const activeEl = document.getElementById(`store-option-${selectedStoreIndex}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedStoreIndex, isImportStoreModalOpen]);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'import-shopee') {
      if (storesList && storesList.length > 0) {
        // Cari toko Shopee pertama, jika tidak ada fallback ke toko pertama di list
        const shopeeStore = storesList.find((s: any) => s.platform?.toLowerCase() === 'shopee') || storesList[0];
        setShopeeStoreId((prev: string) => prev || shopeeStore.id.toString());
        setIsImportStoreModalOpen(true);
      } else {
        alert('Buat toko/marketplace terlebih dahulu di Master Data!');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (action === 'import-status') {
      setTimeout(() => {
        statusFileInputRef.current?.click();
      }, 150);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [storesList]);

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUploadProof = (file: File) => {
    const formData = new FormData();
    formData.append('package_proof', file);
    
    router.post(`/finance/transactions/${selectedTransaction.id}/upload-proof`, formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success('Bukti packing berhasil diunggah!');
      },
      onError: (errors: any) => {
        toast.error(errors.package_proof || 'Gagal mengunggah bukti.');
      }
    });
  };

  const handleDeleteProof = () => {
    if (!confirm('Apakah Anda yakin ingin menghapus bukti packing ini?')) return;
    
    router.post(`/finance/transactions/${selectedTransaction.id}/delete-proof`, {}, {
      onSuccess: () => {
        toast.success('Bukti packing berhasil dihapus.');
      }
    });
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
    setCustomerId('');
    setShippingCost(0);
    setCourierCompany('');
    setCourierType('');
    setAvailableCouriers([]);
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
  const liveGrandTotal = Math.max(0, liveSubtotal - liveDiscount + (Number(shippingCost) || 0));

  return (
    <>
      <Head title="Data Transaksi" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-2">
          <Heading
            title="Riwayat Transaksi"
            description="Manajemen data penjualan semua marketplace."
          />
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 w-full sm:w-auto" disabled={shopeeUploadProcessing || uploadProcessing}>
                  {shopeeUploadProcessing || uploadProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                      Proses...
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
              <Button onClick={() => setIsCreateSheetOpen(true)} className="gap-1.5 w-full sm:w-auto">
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
                        </div>

                        {/* Asisten Copy-Paste Alamat WhatsApp */}
                        <div className="border border-indigo-100 dark:border-indigo-950/60 rounded-xl p-4 bg-indigo-50/20 dark:bg-indigo-950/5 space-y-3">
                          <Label className="text-xs font-bold text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
                            <MessageCircle className="size-4" /> Asisten Copy-Paste Alamat WhatsApp
                          </Label>
                          <textarea
                            placeholder="Tempel chat alamat pelanggan di sini... Contoh:&#10;Nama: Anita Rahmawati&#10;HP: 081299887766&#10;Alamat: Perumahan Indah Permai Blok B2 No. 5, RT 01/RW 04, Kec. Menteng"
                            value={rawAddressPaste}
                            onChange={(e) => setRawAddressPaste(e.target.value)}
                            className="flex min-h-[80px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={handleParseAddress}
                              className="flex-1 h-8 text-xs bg-indigo-100/70 hover:bg-indigo-150 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold rounded-lg"
                            >
                              Urai & Isi Otomatis
                            </Button>
                            {rawAddressPaste && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setRawAddressPaste('');
                                  setParsedDetails(null);
                                }}
                                className="h-8 text-xs text-muted-foreground rounded-lg"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          
                          {parsedDetails && (
                            <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs space-y-2 mt-2">
                              <p className="font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">Hasil Uraian Alamat</p>
                              <div className="grid grid-cols-3 gap-1">
                                <div className="text-muted-foreground">Nama:</div>
                                <div className="col-span-2 font-medium text-foreground break-words">{parsedDetails.name || '-'}</div>
                                
                                <div className="text-muted-foreground">No HP:</div>
                                <div className="col-span-2 font-semibold font-mono text-foreground break-words">{parsedDetails.phone || '-'}</div>
                                
                                <div className="text-muted-foreground">Alamat:</div>
                                <div className="col-span-2 text-foreground break-words whitespace-pre-wrap">{parsedDetails.address || '-'}</div>
                                
                                {parsedDetails.subdistrict && (
                                  <>
                                    <div className="text-muted-foreground">Kecamatan:</div>
                                    <div className="col-span-2 text-indigo-650 dark:text-indigo-400 font-semibold break-words">"{parsedDetails.subdistrict}"</div>
                                  </>
                                )}
                              </div>

                              {/* Match detection status */}
                              {detectedCustomer ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 mt-2">
                                  <Check className="size-3.5 stroke-[3]" /> Terdeteksi pelanggan terdaftar: <strong>{detectedCustomer.name}</strong>
                                </div>
                              ) : (
                                <div className="mt-3 pt-2 border-t border-zinc-150 dark:border-zinc-850 flex flex-col gap-2">
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    ⚠️ Pelanggan ini belum terdaftar di sistem.
                                  </span>
                                  <Button
                                    type="button"
                                    onClick={handleRegisterCustomerInline}
                                    disabled={isRegisteringCustomer || !parsedDetails.name}
                                    className="w-full h-8 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                                  >
                                    {isRegisteringCustomer ? 'Mendaftarkan...' : 'Daftarkan & Hubungkan Pelanggan'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hubungkan Pelanggan */}
                        <div className="grid gap-1.5">
                          <Label htmlFor="customer_id">Hubungkan Pelanggan <span className="text-muted-foreground text-[10px]">(Opsional)</span></Label>
                          <Select value={customerId} onValueChange={setCustomerId}>
                            <SelectTrigger id="customer_id_trigger" className="w-full bg-background">
                              <SelectValue placeholder="Pilih Pelanggan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">--- Tanpa Pelanggan ---</SelectItem>
                              {customersList?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name} {c.username ? `(@${c.username})` : ''} - {c.platform}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input type="hidden" name="customer_id" value={customerId === 'none' ? '' : customerId} />
                          <InputError message={errors.customer_id} />
                        </div>

                        {/* Biteship Shipping Rates Calculation & Selector */}
                        {customerId && customerId !== 'none' && (
                          <div className="border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2 border-zinc-200/40 dark:border-zinc-800/40">
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Pengiriman Biteship</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fetchShippingRates(txBiteshipAreaId, items)}
                                disabled={isLoadingRates || !txBiteshipAreaId}
                                className="h-7 text-[11px]"
                              >
                                {isLoadingRates ? 'Menghitung...' : 'Cek Tarif Ongkir'}
                              </Button>
                            </div>

                            {/* Autocomplete Kecamatan/Kelurahan */}
                            <div className="grid gap-2 relative">
                              <Label className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Wilayah Kecamatan/Kelurahan Tujuan</Label>
                              {txBiteshipAreaName ? (
                                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                                  <span className="font-medium text-foreground truncate max-w-[80%]">{txBiteshipAreaName}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setTxBiteshipAreaId('');
                                      setTxBiteshipAreaName('');
                                      setTxAreaSearchQuery('');
                                    }}
                                    className="h-7 px-2 text-xs text-red-500 hover:text-red-650 rounded-md"
                                  >
                                    Ganti
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                      type="text"
                                      placeholder="Cari kecamatan tujuan (misal: Kebayoran Lama)..."
                                      value={txAreaSearchQuery}
                                      onChange={(e) => setTxAreaSearchQuery(e.target.value)}
                                      className="pl-9 text-xs rounded-xl bg-background"
                                    />
                                  </div>
                                  {isSearchingTxAreas && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 p-3 text-xs text-center text-zinc-500 animate-pulse">
                                      Mencari wilayah...
                                    </div>
                                  )}
                                  {!isSearchingTxAreas && txSearchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-800">
                                      {txSearchResults.map((area: any) => (
                                        <div
                                          key={area.id}
                                          onClick={() => {
                                            setTxBiteshipAreaId(area.id);
                                            setTxBiteshipAreaName(`${area.name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}`);
                                            setTxSearchResults([]);
                                            setTxAreaSearchQuery('');
                                          }}
                                          className="p-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer text-left text-zinc-700 dark:text-zinc-300 transition-colors"
                                        >
                                          {area.name}, {area.administrative_division_level_2_name}, {area.administrative_division_level_1_name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {txBiteshipAreaId && availableCouriers.length > 0 ? (
                              <div className="grid gap-2 max-h-40 overflow-y-auto pr-1 pt-2 border-t border-dashed">
                                {availableCouriers.map((courier: any, idx: number) => {
                                  const isSelected = courierCompany === courier.courier_code && courierType === courier.courier_service;
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        setCourierCompany(courier.courier_code);
                                        setCourierType(courier.courier_service);
                                        setShippingCost(courier.price);
                                      }}
                                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                                        isSelected
                                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                                          : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                                      }`}
                                    >
                                      <div className="flex flex-col text-left">
                                        <span className="capitalize">{courier.courier_name} ({courier.courier_service})</span>
                                        <span className="text-[10px] text-zinc-400">Estimasi: {courier.duration || '-'}</span>
                                      </div>
                                      <span className="font-bold">Rp {courier.price.toLocaleString('id-ID')}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : txBiteshipAreaId ? (
                              <p className="text-[10px] text-zinc-400 italic">
                                Klik "Cek Tarif Ongkir" untuk memuat opsi kurir pengiriman dari Biteship.
                              </p>
                            ) : (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Silakan cari dan tentukan wilayah kecamatan tujuan di atas terlebih dahulu.
                              </p>
                            )}
                          </div>
                        )}
                        <input type="hidden" name="courier_company" value={courierCompany} />
                        <input type="hidden" name="courier_type" value={courierType} />
                        <input type="hidden" name="shipping_cost" value={shippingCost} />

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
                          {shippingCost > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Ongkos Kirim ({courierCompany.toUpperCase()} - {courierType.toUpperCase()}):</span>
                              <span className="text-foreground font-semibold">+{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(shippingCost)}</span>
                            </div>
                          )}
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
                    <TableHead className="text-xs">Bukti Paket</TableHead>
                    <TableHead className="text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
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

                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {tx.package_proof ? (
                                <div 
                                  onClick={() => {
                                    setSelectedTransaction(tx);
                                    setIsSheetOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer text-xs"
                                >
                                  <CheckCircle className="h-4 w-4 shrink-0" />
                                  <span>Ada Bukti</span>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    setSelectedTransaction(tx);
                                    setIsSheetOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-medium hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer text-xs"
                                >
                                  <XCircle className="h-4 w-4 shrink-0 animate-pulse" />
                                  <span>Belum Ada</span>
                                </div>
                              )}
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

                {/* Biteship Shipping Integration Section */}
                {selectedTransaction.store?.platform === 'manual' && (
                  <div className="border border-indigo-100 dark:border-indigo-950 p-4 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/10 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 border-indigo-150/40 dark:border-indigo-900/40">
                      <span className="text-xs font-bold text-indigo-755 dark:text-indigo-300 flex items-center gap-1.5">
                        <Truck className="h-4 w-4" />
                        Layanan Pengiriman (Biteship)
                      </span>
                      {selectedTransaction.waybill_number && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          Resi Terbit
                        </Badge>
                      )}
                    </div>

                    {selectedTransaction.waybill_number ? (
                      <div className="space-y-3.5 text-xs text-left">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-400 block uppercase">Kurir / Layanan</span>
                            <span className="font-semibold capitalize text-foreground">
                              {selectedTransaction.courier_name} ({selectedTransaction.courier_service})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block uppercase">No. Resi (Waybill)</span>
                            <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                              {selectedTransaction.waybill_number}
                              <CopyButton value={selectedTransaction.waybill_number} />
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-400 block uppercase">Ongkir Biteship</span>
                            <span className="font-semibold text-foreground">
                              Rp {parseFloat(selectedTransaction.shipping_cost || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block uppercase">Status Pengiriman</span>
                            <span className="font-semibold text-indigo-650 dark:text-indigo-400 uppercase">
                              {selectedTransaction.shipping_status || 'Diproses'}
                            </span>
                          </div>
                        </div>

                        {/* Aksi Label dan WhatsApp Lacak */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedTransaction.shipping_label_url && (
                            <Button
                              type="button"
                              onClick={() => window.open(selectedTransaction.shipping_label_url, '_blank')}
                              className="h-8 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg px-3 flex items-center gap-1.5"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Cetak Label PDF
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const phone = selectedTransaction.customer?.phone;
                              if (!phone) {
                                alert('Pelanggan tidak memiliki nomor telepon terdaftar.');
                                return;
                              }
                              const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                              const message = `Halo ${selectedTransaction.customer.name}, pesanan Kakak dengan invoice ${selectedTransaction.invoice_number} sedang dikirim menggunakan ${selectedTransaction.courier_name.toUpperCase()} (${selectedTransaction.courier_service.toUpperCase()}) dengan nomor resi: ${selectedTransaction.waybill_number}. Lacak paket di: https://biteship.com/id/tracking/${selectedTransaction.waybill_number}`;
                              window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                            className="h-8 text-xs rounded-lg px-3 border-emerald-650/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-1"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            Kirim Resi ke WA
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={fetchTrackingDetails}
                            disabled={isLoadingTracking}
                            className="h-8 text-xs rounded-lg px-3 border-indigo-650/30 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                          >
                            {isLoadingTracking ? 'Memuat...' : 'Lacak Paket'}
                          </Button>
                        </div>

                        {/* Live Tracking Timeline */}
                        {trackingDetails && (
                          <div className="border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs space-y-2 mt-2 animate-in slide-in-from-top-1 w-full">
                            <span className="font-semibold text-foreground block">Riwayat Pengiriman:</span>
                            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100 dark:before:bg-indigo-950 pl-5">
                              {trackingDetails.history && trackingDetails.history.length > 0 ? (
                                trackingDetails.history.map((hist: any, hIdx: number) => (
                                  <div key={hIdx} className="relative space-y-0.5">
                                    <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-950/50" />
                                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{hist.status} - {hist.note}</p>
                                    <p className="text-[10px] text-zinc-400 italic">
                                      {formatDateTime(hist.updated_at).dateStr} {formatDateTime(hist.updated_at).timeStr}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-[10px] text-zinc-400 italic">Belum ada riwayat update dari kurir.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        <p className="text-xs text-zinc-500">
                          Pemesanan pickup Biteship belum dilakukan untuk order manual ini. Pastikan customer terhubung dan data alamat lengkap serta kelurahan sudah diset.
                        </p>

                        <div className="border rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-800/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Pilihan Kurir & Tarif</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchDetailShippingRates}
                              disabled={isDetailLoadingRates}
                              className="h-7 text-[11px]"
                            >
                              {isDetailLoadingRates ? 'Menghitung...' : 'Cek Tarif Kurir'}
                            </Button>
                          </div>

                          {detailAvailableCouriers.length > 0 ? (
                            <div className="grid gap-1.5 max-h-40 overflow-y-auto pr-1">
                              {detailAvailableCouriers.map((courier: any, idx: number) => {
                                const isSelected = detailCourierCompany === courier.courier_code && detailCourierType === courier.courier_service;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setDetailCourierCompany(courier.courier_code);
                                      setDetailCourierType(courier.courier_service);
                                      setDetailShippingCost(courier.price);
                                    }}
                                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                                      isSelected
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                                        : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                  >
                                    <div className="flex flex-col text-left">
                                      <span className="capitalize">{courier.courier_name} ({courier.courier_service})</span>
                                      <span className="text-[10px] text-zinc-400">Estimasi: {courier.duration || '-'}</span>
                                    </div>
                                    <span className="font-bold">Rp {courier.price.toLocaleString('id-ID')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-zinc-400 italic">
                              Klik "Cek Tarif Kurir" untuk memuat opsi pengiriman dari Biteship.
                            </p>
                          )}
                        </div>

                        {detailCourierCompany && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-dashed">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Kurir Terpilih:</span>
                              <span className="font-bold text-indigo-600 capitalize">{detailCourierCompany} ({detailCourierType})</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Ongkir:</span>
                              <span className="font-bold text-foreground">Rp {detailShippingCost.toLocaleString('id-ID')}</span>
                            </div>

                            <Button
                              type="button"
                              onClick={async () => {
                                if (!selectedTransaction.customer?.biteship_area_id) {
                                  alert('Customer belum memiliki wilayah Kecamatan/Kelurahan Biteship di profilnya. Edit profil customer terlebih dahulu.');
                                  return;
                                }
                                if (!confirm('Apakah Anda yakin ingin memesan kurir pengiriman Biteship untuk transaksi ini? Saldo deposit Biteship Anda akan terpotong secara otomatis.')) {
                                  return;
                                }

                                router.post(`/api/biteship/transactions/${selectedTransaction.id}/book`, {
                                  courier_company: detailCourierCompany,
                                  courier_type: detailCourierType,
                                  shipping_cost: detailShippingCost
                                }, {
                                  preserveScroll: true,
                                  onSuccess: () => {
                                    alert('Berhasil melakukan booking shipment ke Biteship! Nomor resi dan label PDF telah diterbitkan.');
                                    setIsSheetOpen(false);
                                  },
                                  onError: (errors: any) => {
                                    alert(errors.error || 'Gagal melakukan booking shipment ke Biteship.');
                                  }
                                });
                              }}
                              className="w-full h-10 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-1.5 mt-1"
                            >
                              <Truck className="h-4 w-4" />
                              Konfirmasi & Pesan Pickup Sekarang
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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

                {/* BUKTI PACKING / KIRIM PAKET */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Bukti Packing / Kirim Paket</Label>
                    {selectedTransaction.package_proof && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`/storage/${selectedTransaction.package_proof}`}
                          download={`bukti-packing-${selectedTransaction.invoice_number || 'pesanan'}.jpg`}
                          className="h-6 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-2 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Download className="h-3 w-3" /> Unduh Bukti
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleDeleteProof}
                          className="h-6 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus Bukti
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedTransaction.package_proof ? (
                    <div className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden aspect-[4/3] bg-muted shadow-sm hover:shadow-md transition-all duration-300">
                      <img 
                        src={`/storage/${selectedTransaction.package_proof}`} 
                        alt="Bukti Packing" 
                        className="w-full h-full object-cover"
                      />
                      {/* Premium Hover Zoom Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-300 backdrop-blur-xs">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-8 text-xs font-semibold gap-1 hover:scale-105 transition-transform"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              Perbesar Foto
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-3xl p-1 bg-black border-none rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative w-full max-h-[85vh] bg-zinc-950 flex items-center justify-center">
                              <img 
                                src={`/storage/${selectedTransaction.package_proof}`} 
                                alt="Detail Bukti Packing" 
                                className="max-w-full max-h-[85vh] object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <a
                          href={`/storage/${selectedTransaction.package_proof}`}
                          download={`bukti-packing-${selectedTransaction.invoice_number || 'pesanan'}.jpg`}
                          className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-3 text-xs font-semibold gap-1 hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Unduh
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        id="proof-upload-input" 
                        accept="image/png, image/jpeg, image/jpg, image/webp" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadProof(e.target.files[0]);
                          }
                        }}
                      />
                      <label 
                        htmlFor="proof-upload-input"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all duration-300 text-center space-y-2 group"
                      >
                        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:scale-110 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-300">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Unggah Bukti Packing
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                            Format JPG, PNG, WebP (Maks. 5MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
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
                                      router.get(ProductController.index(), { search: searchQuery });
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

      {/* MODAL DIALOG PILIH TOKO UNTUK IMPOR */}
      <Dialog open={isImportStoreModalOpen} onOpenChange={setIsImportStoreModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-500 animate-pulse" />
              Pilih Toko Tujuan Impor
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Pilih toko asal pesanan Shopee di bawah untuk meluncurkan impor berkas Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
              {storesList?.map((s: any, idx: number) => {
                const isShopee = s.platform?.toLowerCase() === 'shopee';
                const isActive = idx === selectedStoreIndex;
                return (
                  <button
                    key={s.id}
                    id={`store-option-${idx}`}
                    onClick={() => {
                      setShopeeStoreId(s.id.toString());
                      setIsImportStoreModalOpen(false);
                      setTimeout(() => {
                        shopeeFileInputRef.current?.click();
                      }, 150);
                    }}
                    className={`group relative flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-300 w-full hover:-translate-y-0.5 active:translate-y-0 ${
                      isActive 
                        ? isShopee 
                          ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/30 dark:border-orange-500 dark:bg-orange-950/20 shadow-md' 
                          : 'border-indigo-500 bg-zinc-550/10 ring-2 ring-indigo-550/20 dark:border-indigo-500 dark:bg-zinc-800/30 shadow-md'
                        : isShopee 
                          ? 'border-orange-200 bg-orange-50/15 hover:border-orange-500 hover:bg-orange-50/25 dark:border-orange-950/40 dark:bg-orange-950/5 dark:hover:border-orange-500/80 dark:hover:bg-orange-950/15 shadow-sm hover:shadow-md' 
                          : 'border-zinc-200 bg-zinc-50/20 hover:border-indigo-500 hover:bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/10 dark:hover:border-indigo-500 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Platform Icon Badge */}
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                        isActive
                          ? isShopee
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-indigo-650 text-white border-indigo-500'
                          : isShopee
                            ? 'bg-orange-500/10 text-orange-600 border-orange-200/50 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-900/40 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500'
                      }`}>
                        <Store className="h-5 w-5" />
                      </div>

                      {/* Store Details */}
                      <div className="min-w-0 space-y-0.5">
                        <p className={`text-xs font-black transition-colors truncate ${
                          isActive
                            ? isShopee ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-650 dark:text-indigo-400'
                            : 'text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          {s.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {s.transactions_count ?? 0} Transaksi Terdaftar
                        </p>
                      </div>
                    </div>

                    {/* Platform Badge */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive
                          ? isShopee
                            ? 'bg-orange-500 text-white'
                            : 'bg-indigo-650 text-white'
                          : isShopee
                            ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400'
                            : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {s.platform}
                      </span>
                      {/* Chevron Arrow Icon */}
                      <span className={`transition-all duration-300 font-bold text-sm ${
                        isActive 
                          ? isShopee ? 'text-orange-500 scale-110 translate-x-0.5' : 'text-indigo-500 scale-110 translate-x-0.5'
                          : 'text-zinc-300 dark:text-zinc-750 group-hover:text-indigo-500 group-hover:translate-x-0.5'
                      }`}>
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsImportStoreModalOpen(false)}
              className="text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

Transactions.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Riwayat Transaksi', href: TransactionController.index() },
  ],
};
import { router } from '@inertiajs/react';
import {
  ArrowRightLeft,
  Box,
  ChartBar,
  ClipboardList,
  Database,
  DollarSign,
  LayoutGrid,
  Megaphone,
  PackagePlus,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Tags,
  Users,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Camera,
  Image,
  Loader2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  url: string;
  action?: string;
  shortcut?: string;
}

const commands: CommandItem[] = [
  // --- NAVIGASI ---
  { id: 'nav-dashboard', title: 'Buka Dashboard', category: 'Navigasi Menu', icon: LayoutGrid, url: '/dashboard', shortcut: 'D' },
  { id: 'nav-margin', title: 'Buka Analisa Margin', category: 'Navigasi Menu', icon: ChartBar, url: '/finance/margin-analysis', shortcut: 'M' },
  { id: 'nav-transactions', title: 'Buka Riwayat Transaksi', category: 'Navigasi Menu', icon: ShoppingBag, url: '/finance/transactions', shortcut: 'T' },
  { id: 'nav-packing-station', title: 'Buka Stasiun Packing Otomatis', category: 'Navigasi Menu', icon: Camera, url: '/finance/transactions/packing-station', shortcut: 'P' },
  { id: 'nav-ads', title: 'Buka Iklan & Affiliasi', category: 'Navigasi Menu', icon: Megaphone, url: '/finance/ads-affiliate', shortcut: 'A' },
  { id: 'nav-mutations', title: 'Buka Mutasi Kas', category: 'Navigasi Menu', icon: ArrowRightLeft, url: '/finance/mutations', shortcut: 'K' },
  { id: 'nav-profit-loss', title: 'Buka Laporan Laba Rugi', category: 'Navigasi Menu', icon: DollarSign, url: '/finance/profit-loss' },
  { id: 'nav-producer-stocks', title: 'Buka Faktur Produsen', category: 'Navigasi Menu', icon: PackagePlus, url: '/operational/producer-stocks', shortcut: 'F' },
  { id: 'nav-products', title: 'Buka Stok & Produk', category: 'Navigasi Menu', icon: Box, url: '/operational/products', shortcut: 'S' },
  { id: 'nav-supplies', title: 'Buka Bahan Operasional', category: 'Navigasi Menu', icon: ClipboardList, url: '/operational/supplies' },
  { id: 'nav-producers', title: 'Buka Profil Produsen', category: 'Navigasi Menu', icon: Users, url: '/master-data/producers' },
  { id: 'nav-categories', title: 'Buka Kategori Produk', category: 'Navigasi Menu', icon: Tags, url: '/master-data/categories' },
  { id: 'nav-stores', title: 'Buka Daftar Toko', category: 'Navigasi Menu', icon: Store, url: '/master-data/stores' },
  { id: 'nav-customers', title: 'Buka Daftar Pelanggan', category: 'Navigasi Menu', icon: Users, url: '/master-data/customers' },
  { id: 'nav-backups', title: 'Buka Backup Database', category: 'Navigasi Menu', icon: Database, url: '/master-data/backups' },

  // --- AKSI CEPAT ---
  { id: 'act-new-tx', title: 'Catat Transaksi Manual Baru', category: 'Aksi Cepat', icon: Plus, url: '/finance/transactions', action: 'create', shortcut: 'N' },
  { id: 'act-new-prod', title: 'Tambah Produk Baru', category: 'Aksi Cepat', icon: Plus, url: '/operational/products', action: 'create' },
  { id: 'act-new-mutation', title: 'Catat Mutasi Kas Baru', category: 'Aksi Cepat', icon: Plus, url: '/finance/mutations', action: 'create' },
  { id: 'act-new-ads', title: 'Catat Biaya Iklan & Affiliate Baru', category: 'Aksi Cepat', icon: Plus, url: '/finance/ads-affiliate', action: 'create', shortcut: 'Shift+A' },
  { id: 'act-new-account', title: 'Buat Akun Kas / Bank Baru', category: 'Aksi Cepat', icon: Plus, url: '/finance/mutations', action: 'create-account' },
  { id: 'act-transfer', title: 'Transfer Saldo Antar Rekening/Kas', category: 'Aksi Cepat', icon: ArrowRightLeft, url: '/finance/mutations', action: 'transfer' },
  { id: 'act-new-category', title: 'Tambah Kategori Produk Baru', category: 'Aksi Cepat', icon: Plus, url: '/master-data/categories', action: 'create' },
  { id: 'act-new-store', title: 'Tambah Toko / Marketplace Baru', category: 'Aksi Cepat', icon: Plus, url: '/master-data/stores', action: 'create' },
  { id: 'act-new-producer', title: 'Tambah Profil Produsen Baru', category: 'Aksi Cepat', icon: Plus, url: '/master-data/producers', action: 'create' },
  { id: 'act-new-stock-in', title: 'Catat Faktur / Stok Masuk Produsen', category: 'Aksi Cepat', icon: Plus, url: '/operational/producer-stocks', action: 'create' },
  { id: 'act-new-supply', title: 'Tambah Bahan Operasional Baru', category: 'Aksi Cepat', icon: Plus, url: '/operational/supplies', action: 'create' },
  { id: 'act-run-backup', title: 'Jalankan Backup Database Sekarang', category: 'Aksi Cepat', icon: Database, url: '/master-data/backups', action: 'run', shortcut: 'B' },
  { id: 'act-import-shopee', title: 'Impor Excel Pesanan Shopee', category: 'Aksi Cepat', icon: Upload, url: '/finance/transactions', action: 'import-shopee', shortcut: 'I' },
  { id: 'act-import-status', title: 'Impor Excel Status Pesanan', category: 'Aksi Cepat', icon: Upload, url: '/finance/transactions', action: 'import-status', shortcut: 'U' },
  { id: 'act-packing-station', title: 'Buka Stasiun Packing Otomatis', category: 'Aksi Cepat', icon: Camera, url: '/finance/transactions/packing-station', shortcut: 'P' },
  { id: 'act-export-profit', title: 'Unduh Excel Laporan Laba Rugi', category: 'Aksi Cepat', icon: FileSpreadsheet, url: '/finance/profit-loss/export' },
  { id: 'act-export-tx', title: 'Unduh Excel Riwayat Transaksi', category: 'Aksi Cepat', icon: FileSpreadsheet, url: '/finance/transactions/export' }
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofResult, setProofResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ESC key listener for proof dialog
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProofModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Keyboard shortcut listener Ctrl+K & Global hotkeys (I, U, B, P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputActive = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable;
      
      // Ctrl+K to toggle command palette
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Ignore other shortcuts when typing in inputs/textareas
      if (isInputActive) return;

      // Ignore other shortcuts if the command palette is open
      if (isOpen) return;

      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        router.visit('/finance/transactions?action=import-shopee');
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        router.visit('/finance/transactions?action=import-status');
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        router.visit('/master-data/backups?action=run');
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        router.visit('/finance/transactions/packing-station');
      } else if (e.key === 'd') {
        e.preventDefault();
        router.visit('/dashboard');
      } else if (e.key === 'm') {
        e.preventDefault();
        router.visit('/finance/margin-analysis');
      } else if (e.key === 't') {
        e.preventDefault();
        router.visit('/finance/transactions');
      } else if (e.key === 'k') {
        e.preventDefault();
        router.visit('/finance/mutations');
      } else if (e.key === 'f') {
        e.preventDefault();
        router.visit('/operational/producer-stocks');
      } else if (e.key === 'a') {
        e.preventDefault();
        router.visit('/finance/ads-affiliate');
      } else if (e.key === 'A') {
        e.preventDefault();
        router.visit('/finance/ads-affiliate?action=create');
      } else if (e.key === 's') {
        e.preventDefault();
        router.visit('/operational/products');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter commands based on query search
  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Jika query tidak kosong, tambahkan aksi pencarian bukti packing dinamis di posisi paling atas
  const queryClean = query.trim();
  if (queryClean) {
    filtered.unshift({
      id: 'dynamic-search-proof',
      title: `Cari Bukti Packing untuk "${queryClean}"`,
      category: 'Pencarian Resi/Pesanan',
      icon: Camera,
      url: '#',
      action: 'search-proof'
    });
  }

  // Group filtered results by category
  const categories: Record<string, CommandItem[]> = {};
  filtered.forEach((item) => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });

  // Re-flatten array for index calculation
  const flattenedFiltered: CommandItem[] = [];
  Object.keys(categories).forEach((cat) => {
    categories[cat].forEach((item) => {
      flattenedFiltered.push(item);
    });
  });

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view inside the list wrapper
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = async (item: CommandItem) => {
    if (item.id === 'dynamic-search-proof') {
      const q = query.trim();
      if (!q) return;

      setSearchLoading(true);
      try {
        const response = await fetch(`/finance/transactions/search-proof?query=${encodeURIComponent(q)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setIsOpen(false);
          setProofResult(data.transaction);
          setIsProofModalOpen(true);
        } else {
          toast.error(data.message || 'Bukti packing tidak ditemukan untuk nomor ini.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Koneksi bermasalah, gagal mencari bukti packing.');
      } finally {
        setSearchLoading(false);
      }
      return;
    }

    setIsOpen(false);
    
    let targetUrl = item.url;
    if (item.action) {
      targetUrl += `?action=${item.action}`;
    }

    router.visit(targetUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flattenedFiltered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattenedFiltered.length) % Math.max(1, flattenedFiltered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedFiltered[selectedIndex]) {
        handleSelect(flattenedFiltered[selectedIndex]);
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 md:px-0 text-zinc-900 dark:text-zinc-50"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Card UI */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl transition-all flex flex-col max-h-[480px]">
            {/* Search header bar */}
            <div className="flex items-center gap-3 border-b border-zinc-150 dark:border-zinc-800 px-4 py-3.5">
              <Search className="size-4.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari perintah atau nama menu... (misal: Transaksi, Produk)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-0"
              />
              {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />}
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 bg-zinc-50 px-1.5 font-mono text-[9px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
                ESC
              </kbd>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 no-scrollbar" ref={listRef}>
              {flattenedFiltered.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  Tidak ada perintah atau menu yang cocok dengan kata kunci "{query}".
                </div>
              ) : (
                Object.keys(categories).map((catName) => (
                  <div key={catName} className="space-y-1">
                    {/* Category Header Label */}
                    <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {catName}
                    </div>

                    {/* Category Items */}
                    {categories[catName].map((item) => {
                      const itemIndex = flattenedFiltered.findIndex((f) => f.id === item.id);
                      const isActive = itemIndex === selectedIndex;

                      const Icon = item.icon;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                            isActive
                              ? 'bg-indigo-650 text-white font-semibold dark:bg-indigo-600'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={`size-4 shrink-0 ${
                                isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-3 shrink-0">
                            {item.shortcut && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-mono border ${
                                  isActive
                                    ? 'bg-indigo-700/60 border-indigo-500/40 text-indigo-100'
                                    : 'bg-zinc-50 border-zinc-150 text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-500'
                                }`}
                              >
                                {item.shortcut}
                              </span>
                            )}
                            <span
                              className={`text-[10px] ${
                                isActive ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-500'
                              }`}
                            >
                              {item.action ? 'Aksi' : 'Buka'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer info bar */}
            <div className="border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-2 text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span>↑↓ Pilih</span>
                <span>↵ Enter Jalankan</span>
              </div>
              <div>
                <span>Tekan <kbd className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-[9px]">Ctrl + K</kbd> untuk buka/tutup</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Packing Proof Popup Modal */}
      {isProofModalOpen && proofResult && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsProofModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-250 m-4 text-zinc-900 dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Bukti Packing Ditemukan</span>
              </div>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                Tutup (ESC)
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  proofResult.platform.toLowerCase() === 'shopee'
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}>
                  {proofResult.platform}
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {proofResult.store_name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">No. Pesanan</p>
                  <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{proofResult.invoice_number}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">No. Resi (Waybill)</p>
                  <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{proofResult.waybill_number}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Tanggal Transaksi</p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                    {new Date(proofResult.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase">Total Nilai</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(proofResult.grand_total)}
                  </p>
                </div>
              </div>

              {/* Photo Proof */}
              {proofResult.package_proof ? (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex items-center justify-center">
                    <img
                      src={proofResult.package_proof}
                      alt="Bukti Packing"
                      className="h-full w-full object-cover animate-in fade-in duration-300"
                    />
                  </div>
                  <a
                    href={proofResult.package_proof}
                    download={`Bukti_Packing_${proofResult.invoice_number}.jpg`}
                    target="_blank"
                    className="w-full h-9 text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh Bukti Pengiriman (Banding)
                  </a>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col items-center justify-center text-center p-4 gap-2">
                  <Image className="h-8 w-8 text-zinc-400" />
                  <p className="text-xs font-bold text-zinc-500">Belum Ada Foto Bukti</p>
                  <p className="text-[10px] text-zinc-400">Transaksi ini belum didokumentasikan di Stasiun Packing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

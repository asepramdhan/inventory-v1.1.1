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
  Camera
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigasi Menu' | 'Aksi Cepat';
  icon: any;
  url: string;
  action?: string;
  shortcut?: string;
}

const commands: CommandItem[] = [
  // --- NAVIGASI ---
  { id: 'nav-dashboard', title: 'Buka Dashboard', category: 'Navigasi Menu', icon: LayoutGrid, url: '/dashboard' },
  { id: 'nav-margin', title: 'Buka Analisa Margin', category: 'Navigasi Menu', icon: ChartBar, url: '/finance/margin-analysis' },
  { id: 'nav-transactions', title: 'Buka Riwayat Transaksi', category: 'Navigasi Menu', icon: ShoppingBag, url: '/finance/transactions' },
  { id: 'nav-ads', title: 'Buka Iklan & Affiliasi', category: 'Navigasi Menu', icon: Megaphone, url: '/finance/ads-affiliate' },
  { id: 'nav-mutations', title: 'Buka Mutasi Kas', category: 'Navigasi Menu', icon: ArrowRightLeft, url: '/finance/mutations' },
  { id: 'nav-profit-loss', title: 'Buka Laporan Laba Rugi', category: 'Navigasi Menu', icon: DollarSign, url: '/finance/profit-loss' },
  { id: 'nav-producer-stocks', title: 'Buka Faktur Produsen', category: 'Navigasi Menu', icon: PackagePlus, url: '/operational/producer-stocks' },
  { id: 'nav-products', title: 'Buka Stok & Produk', category: 'Navigasi Menu', icon: Box, url: '/operational/products' },
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
  { id: 'act-new-ads', title: 'Catat Biaya Iklan & Affiliate Baru', category: 'Aksi Cepat', icon: Plus, url: '/finance/ads-affiliate', action: 'create' },
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (item: CommandItem) => {
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
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

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

  return (
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
          {filtered.length === 0 ? (
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
  );
}

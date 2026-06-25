/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, router } from '@inertiajs/react';
import { Box, FileSpreadsheet, MoreHorizontalIcon, PencilIcon, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductHppController from '@/actions/App/Http/Controllers/ProductHppController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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

export default function ProductHpp({ products, categoriesList, storesList, filters }: any) {
  // State Kontrol Sheet Form HPP & Detail
  const [isSheetOpenForm, setIsSheetOpenForm] = useState(false);
  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false);

  // State Pencarian, Pilihan Checkbox, & Data Produk Terpilih
  const [search, setSearch] = useState(filters?.search || '');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Filter Kategori & Status Produk
  const [categoryFilter, setCategoryFilter] = useState(filters?.category || 'all');
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
  const [storeViewFilter, setStoreViewFilter] = useState('all');

  // ---- STATE BARU: KOMPONEN BIAYA HPP ----
  const [rawPurchase, setRawPurchase] = useState('');
  const [displayPurchase, setDisplayPurchase] = useState('');

  const [rawPackaging, setRawPackaging] = useState('');
  const [displayPackaging, setDisplayPackaging] = useState('');

  const [rawOperational, setRawOperational] = useState('');
  const [displayOperational, setDisplayOperational] = useState('');

  // Sinkronisasi data saat produk dipilih (Mengisi angka awal jika HPP sudah pernah disimpan)
  useEffect(() => {
    setSelectedIds([]);

    if (selectedProduct) {
      const hppData = selectedProduct.hpp; // Mengambil relasi hasOne 'hpp' dari backend

      if (hppData) {
        setRawPurchase(hppData.purchase_price?.toString() || '0');
        setDisplayPurchase(hppData.purchase_price ? new Intl.NumberFormat('id-ID').format(hppData.purchase_price) : '0');

        setRawPackaging(hppData.packaging_cost?.toString() || '0');
        setDisplayPackaging(hppData.packaging_cost ? new Intl.NumberFormat('id-ID').format(hppData.packaging_cost) : '0');

        setRawOperational(hppData.operational_cost?.toString() || '0');
        setDisplayOperational(hppData.operational_cost ? new Intl.NumberFormat('id-ID').format(hppData.operational_cost) : '0');
      } else {
        // Jika HPP belum diatur, kosongkan input agar user isi baru
        resetCostStates();
      }
    } else {
      resetCostStates();
    }
  }, [products, selectedProduct]);

  // Effect untuk server-side search & filtering dengan debounce 300ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      router.get(
        '/master-data/product-hpp', // Sesuai kesepakatan, mengarah ke route index HPP
        {
          search: search,
          category: categoryFilter,
          status: statusFilter
        },
        { preserveState: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, categoryFilter, statusFilter]);

  // Handler Multi-select tabel
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = products.data.map((prod: any) => prod.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, productId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  // Fungsi Aksi Massal (Export Excel Terpilih)
  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const idsQuery = selectedIds.join(',');
    window.location.href = `/master-data/product-hpp/export?ids=${idsQuery}`;
  };

  const resetCostStates = () => {
    setRawPurchase(''); setDisplayPurchase('');
    setRawPackaging(''); setDisplayPackaging('');
    setRawOperational(''); setDisplayOperational('');
  };

  const resetForm = () => {
    setSelectedProduct(null);
    resetCostStates();
  };

  // Helper Formatter Input Rupiah Dinamis
  const handleCostChange = (value: string, setRaw: any, setDisplay: any) => {
    const numericValue = value.replace(/\D/g, '');
    setRaw(numericValue);

    if (numericValue) {
      // Ubah string angka menjadi number (Int) agar TypeScript tidak komplain
      const parsedNumber = parseInt(numericValue, 10);
      setDisplay(new Intl.NumberFormat('id-ID').format(parsedNumber));
    } else {
      setDisplay('');
    }
  };

  // Perhitungan Otomatis Komponen HPP (Live di Frontend)
  const numPurchase = parseInt(rawPurchase) || 0;
  const numPackaging = parseInt(rawPackaging) || 0;
  const numOperational = parseInt(rawOperational) || 0;

  const totalHppCalculated = numPurchase + numPackaging + numOperational;
  const sellingPrice = selectedProduct?.price || 0;
  const estimatedProfit = sellingPrice - totalHppCalculated;

  return (
    <>
      <Head title="HPP Produk" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        {/* HEADING PAGE */}
        <div className="flex items-center justify-between">
          <Heading
            title="Harga Pokok Penjualan (HPP)"
            description="Kalkulasi komponen modal modal material, packing, hingga operasional produk Anda."
          />
        </div>

        {/* BARIS SEKSI FILTER UTAMA */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full bg-card p-3 rounded-lg border border-sidebar-border/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Dropdown Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categoriesList && categoriesList.length > 0 ? (
                  categoriesList.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Tidak ada kategori</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Filter Dropdown Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>

            {/* FILTER TOKO UNTUK PENYESUAIAN MARGIN DI TABEL */}
            <Select value={storeViewFilter} onValueChange={setStoreViewFilter}>
              <SelectTrigger className="w-full sm:w-[180px] border-amber-500/30 text-amber-700 dark:text-amber-400">
                <SelectValue placeholder="Lihat Margin: Semua Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko (Margin Pokok)</SelectItem>
                {storesList && storesList.map((store: any) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name} ({store.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kotak Input Pencarian */}
          <div className="relative w-full max-w-sm sm:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama produk, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* TABEL DATA HPP */}
        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
          <div className="p-6">
            <Table>
              <TableCaption className='py-6'>Daftar perhitungan modal dan margin profit dari produk master Anda.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={products.data.length > 0 && selectedIds.length === products.data.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Gambar</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Total HPP</TableHead>
                  <TableHead>Margin Bersih</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><Box /></EmptyMedia>
                          <EmptyTitle>Belum ada data</EmptyTitle>
                          <EmptyDescription>Tidak ada data produk ditemukan.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.data.map((product: any, index: any) => {
                    const isSelected = selectedIds.includes(product.id);
                    const hasHpp = !!product.hpp;

                    // Hitung HPP & Margin Dinamis berdasarkan toko terpilih di filter
                    let calculatedHpp = hasHpp ? parseFloat(product.hpp.total_hpp) : 0;

                    if (hasHpp && storeViewFilter !== 'all') {
                      const currentStore = storesList.find((s: any) => s.id.toString() === storeViewFilter);
                      if (currentStore) {
                        const potonganAdmin = (product.price * parseFloat(currentStore.admin_fee)) / 100;
                        const potonganProses = parseFloat(currentStore.processing_fee) || 0;
                        // Akumulasikan base hpp produk + potongan admin toko terpilih
                        calculatedHpp = calculatedHpp + potonganAdmin + potonganProses;
                      }
                    }

                    const margin = hasHpp ? (product.price - calculatedHpp) : 0;

                    return (
                      <TableRow key={product.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/70 ${isSelected ? 'bg-muted/60' : index % 2 === 1 ? 'bg-muted/25' : 'bg-background'}`}
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsSheetOpenDetail(true);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(product.id, !!checked)}
                            aria-label={`Select ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          {product.image ? (
                            <HoverCard openDelay={0} closeDelay={0}>
                              <HoverCardTrigger asChild>
                                <div className="w-12 h-12 rounded-sm overflow-hidden border bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" align="center" sideOffset={12} className="w-48 p-1.5 bg-background border shadow-xl rounded-lg">
                                <div className="w-full aspect-square overflow-hidden rounded-sm">
                                  <img src={product.image} alt="Preview Besar" className="w-full h-full object-cover" />
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center border text-muted-foreground/60">
                              <Box className="h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium font-mono text-xs">{product.sku}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground">{product.category?.name || 'Tanpa Kategori'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='font-semibold text-foreground'>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}
                          </span>
                        </TableCell>

                        {/* FIELD KONDISIONAL TOTAL HPP */}
                        <TableCell>
                          {hasHpp ? (
                            <span className='font-bold text-amber-600 dark:text-amber-500'>
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(calculatedHpp)}
                            </span>
                          ) : (
                            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400">Belum Diatur</Badge>
                          )}
                        </TableCell>

                        {/* FIELD KONDISIONAL MARGIN PROFIT */}
                        <TableCell>
                          {hasHpp ? (
                            <span className={`font-extrabold ${margin >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(margin)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontalIcon />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsSheetOpenForm(true);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                                {hasHpp ? 'Edit HPP Produk' : 'Atur HPP Produk'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* PAGINATION */}
            {products.last_page > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t border-sidebar-border/50 dark:border-sidebar-border">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Menampilkan {products.from ?? 0} sampai {products.to ?? 0} dari {products.total ?? 0} produk
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline" size="sm" disabled={!products.prev_page_url}
                    onClick={() => products.prev_page_url && router.get(products.prev_page_url, {}, { preserveState: true })}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-xs md:text-sm font-medium px-2">
                    Hal {products.current_page} dari {products.last_page}
                  </div>
                  <Button
                    variant="outline" size="sm" disabled={!products.next_page_url}
                    onClick={() => products.next_page_url && router.get(products.next_page_url, {}, { preserveState: true })}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= FLOATING ACTION BAR FOR BULK EXPORT ================= */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/4 z-50 flex items-center gap-4 rounded-full border bg-background/95 p-2 pl-4 pr-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">
            <strong className="text-foreground font-semibold">{selectedIds.length}</strong> produk terpilih
          </span>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="rounded-full text-xs h-8">
              Batal
            </Button>
            <Button
              variant="outline" size="sm" onClick={handleBulkExport}
              className="rounded-full gap-1.5 text-xs h-8 border-emerald-600/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel HPP
            </Button>
          </div>
        </div>
      )}

      {/* ================= SHEET DETAIL INFO PRODUK & HPP ================= */}
      <Sheet open={isSheetOpenDetail} onOpenChange={(open) => {
        setIsSheetOpenDetail(open);
        if (!open) resetForm();
      }}
      >
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Rincian Harga & Komponen Modal</SheetTitle>
            <SheetDescription>Rincian lengkap perhitungan struktur HPP produk.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {selectedProduct && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                  {selectedProduct.image && <img src={selectedProduct.image} alt={selectedProduct.name} className="h-14 w-14 rounded-md object-cover border" />}
                  <div className="grid gap-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{selectedProduct.sku || '-'}</span>
                    <h4 className="text-sm font-semibold line-clamp-1">{selectedProduct.name}</h4>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b pb-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Harga Jual</span>
                      <span className="text-base font-bold text-foreground">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedProduct.price)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kategori</span>
                      <span className="text-sm font-medium">{selectedProduct.category?.name || 'Tanpa Kategori'}</span>
                    </div>
                  </div>

                  {selectedProduct.hpp ? (
                    <div className="space-y-3 bg-muted/20 p-4 rounded-xl border">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Penyusun HPP Pokok:</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Harga Beli / Bahan Baku:</span>
                        <span className="font-medium">Rp {parseFloat(selectedProduct.hpp.purchase_price).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Biaya Packing / Dus:</span>
                        <span className="font-medium">Rp {parseFloat(selectedProduct.hpp.packaging_cost).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Biaya Operasional Internal:</span>
                        <span className="font-medium">Rp {parseFloat(selectedProduct.hpp.operational_cost).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="border-t my-2 pt-2 flex justify-between font-bold text-sm">
                        <span>Total HPP Pokok:</span>
                        <span className="text-amber-600">Rp {parseFloat(selectedProduct.hpp.total_hpp).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t border-dashed mt-2 pt-2 pb-1">
                        <span className="text-muted-foreground">Margin Pokok (Sebelum Admin):</span>
                        <span className={(selectedProduct.price - selectedProduct.hpp.total_hpp) >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                          Rp {(selectedProduct.price - selectedProduct.hpp.total_hpp).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* KODE BARU: DAFTAR PROFIT BERSIH RIIL PER TOKO DI SHEET DETAIL */}
                      <div className="space-y-2 mt-4 border-t pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Margin Bersih Riil Per Toko:
                        </span>
                        {storesList && storesList.length > 0 ? (
                          <div className="grid gap-1.5">
                            {storesList.map((store: any) => {
                              const baseHpp = parseFloat(selectedProduct.hpp.total_hpp) || 0;
                              const potonganAdmin = (selectedProduct.price * parseFloat(store.admin_fee)) / 100;
                              const potonganProses = parseFloat(store.processing_fee) || 0;
                              const totalHppToko = baseHpp + potonganAdmin + potonganProses;
                              const profitToko = selectedProduct.price - totalHppToko;

                              return (
                                <div key={store.id} className="flex items-center justify-between p-2 rounded-md bg-background border text-xs">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{store.name}</span>
                                    <span className="text-[9px] text-muted-foreground">Fee: {store.admin_fee}% + Rp {potonganProses.toLocaleString('id-ID')}</span>
                                  </div>
                                  <span className={`font-bold ${profitToko >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                    Rp {profitToko.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">Belum ada data toko terhubung.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground italic">
                      Produk ini belum dikonfigurasi data HPP modalnya.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="p-6 border-t bg-background mt-auto">
            <SheetClose asChild><Button variant="outline" className="w-full">Tutup Rincian</Button></SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* ================= SHEET SHEET FORM ATUR & EDIT COMPONENT HPP ================= */}
      <Sheet open={isSheetOpenForm} onOpenChange={(open) => {
        setIsSheetOpenForm(open);
        if (!open) resetForm();
      }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>{selectedProduct?.hpp ? 'Edit HPP Produk' : 'Atur HPP Produk'}</SheetTitle>
            <SheetDescription>Tentukan rincian pengeluaran modal agar hitungan margin profit bersih toko Anda akurat.</SheetDescription>
          </SheetHeader>

          {/* FORM PROSES SUBMIT KE BACKEND */}
          <Form
            key={selectedProduct?.id}
            // Arahkan ke endpoint khusus manajemen HPP (misal route POST / PATCH hpp)
            // {...{ action: '/master-data/product-hpp/save', method: 'post' } as any}
            {...ProductHppController.save.form(selectedProduct?.id)}
            options={{ preserveScroll: true }}
            onSuccess={() => {
              setIsSheetOpenForm(false);
              resetForm();
            }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {({ processing, errors }: any) => (
              <>
                <div className="grid flex-1 auto-rows-min gap-5 px-6 py-4 overflow-y-auto no-scrollbar">

                  {/* DETAIL RINGKAS PRODUK (READ ONLY SEBAGAI REFERENSI) */}
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/40">
                    {selectedProduct?.image && <img src={selectedProduct.image} alt={selectedProduct.name} className="h-12 w-12 rounded-md object-cover border bg-background" />}
                    <div className="grid gap-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{selectedProduct?.sku}</span>
                      <h4 className="text-sm font-semibold line-clamp-1">{selectedProduct?.name}</h4>
                      <p className="text-xs text-muted-foreground">Harga Jual: <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedProduct?.price)}
                      </span></p>
                    </div>
                  </div>

                  {/* Hidden Input Melempar ID Produk Utama */}
                  <input type="hidden" name="product_id" value={selectedProduct?.id || ''} />

                  {/* INPUT 1: HARGA BELI */}
                  <div className="grid gap-2">
                    <Label htmlFor="purchase_price">Harga Beli / Biaya Bahan Baku (Rp)</Label>
                    <input type="hidden" name="purchase_price" value={rawPurchase} />
                    <Input
                      id="purchase_price" type="text" value={displayPurchase} required
                      onChange={(e) => handleCostChange(e.target.value, setRawPurchase, setDisplayPurchase)}
                      placeholder="Contoh: 25.000"
                    />
                    <InputError message={errors.purchase_price} />
                  </div>

                  {/* INPUT 2: BIAYA PACKING */}
                  <div className="grid gap-2">
                    <Label htmlFor="packaging_cost">Biaya Kemasan & Packing (Rp)</Label>
                    <input type="hidden" name="packaging_cost" value={rawPackaging} />
                    <Input
                      id="packaging_cost" type="text" value={displayPackaging}
                      onChange={(e) => handleCostChange(e.target.value, setRawPackaging, setDisplayPackaging)}
                      placeholder="Bubble wrap, kardus, plastik, lakban..."
                    />
                    <InputError message={errors.packaging_cost} />
                  </div>

                  {/* INPUT 3: BIAYA OPERASIONAL */}
                  <div className="grid gap-2">
                    <Label htmlFor="operational_cost">Biaya Operasional (Rp)</Label>
                    <input type="hidden" name="operational_cost" value={rawOperational} />
                    <Input
                      id="operational_cost" type="text" value={displayOperational}
                      onChange={(e) => handleCostChange(e.target.value, setRawOperational, setDisplayOperational)}
                      placeholder="Gaji karyawan per produk, atau penyusutan alat..."
                    />
                    <InputError message={errors.operational_cost} />
                  </div>

                  {/* BOX LIVE KALKULATOR SUMMARY */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border-2 border-dashed bg-card mt-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground">Total HPP Terhitung</span>
                      <p className="text-lg font-extrabold text-amber-600 dark:text-amber-500">Rp {totalHppCalculated.toLocaleString('id-ID')}</p>
                      <input type="hidden" name="total_hpp" value={totalHppCalculated} />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground">Estimasi Profit Bersih</span>
                      <p className={`text-lg font-extrabold ${estimatedProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        Rp {estimatedProfit.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* ================= TITIK PENAMBAHAN KODE BARU (MULAI DARI SINI) ================= */}
                  <div className="space-y-3 mt-4 border-t pt-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Simulasi Profit Bersih Per Toko (HPP Pokok + Admin Toko):
                    </Label>

                    {storesList && storesList.length > 0 ? (
                      <div className="grid gap-2">
                        {storesList.map((store: any) => {
                          // 1. Hitung Potongan Admin Marketplace (Persentase dari Harga Jual)
                          const potonganAdmin = (sellingPrice * parseFloat(store.admin_fee)) / 100;

                          // 2. Hitung Potongan Biaya Proses Pesanan (Flat)
                          const potonganProses = parseFloat(store.processing_fee) || 0;

                          // 3. Akumulasi Total HPP Khusus Toko ini
                          const totalHppToko = totalHppCalculated + potonganAdmin + potonganProses;

                          // 4. Profit Bersih Toko ini
                          const profitToko = sellingPrice - totalHppToko;

                          return (
                            <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                              <div className="grid gap-0.5">
                                <span className="font-semibold">{store.name} ({store.platform})</span>
                                <span className="text-muted-foreground text-[10px]">
                                  Fee Admin: {store.admin_fee}% + Biaya Proses: Rp {potonganProses.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold ${profitToko >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                  Rp {profitToko.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Belum ada toko aktif. Daftarkan toko Anda di menu Manajemen Toko.
                      </p>
                    )}
                  </div>
                  {/* ================= AKHIR PENAMBAHAN KODE BARU ================= */}
                </div>

                {/* BOTTON ACTION */}
                <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan Komponen HPP'}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" type="button" disabled={processing}>Batal</Button>
                  </SheetClose>
                </SheetFooter>
              </>
            )}
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
}

ProductHpp.layout = {
  breadcrumbs: [
    { title: 'HPP Produk', href: ProductHppController.index() },
  ],
};
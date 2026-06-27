/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @stylistic/padding-line-between-statements */
/* eslint-disable curly */
import { Form, Head, router } from '@inertiajs/react';
import { Box, Check, Copy, EyeIcon, FileSpreadsheet, Plus, RefreshCw, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      // 1. Jika di HTTPS / Localhost resmi
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        // 2. Fallback untuk HTTP biasa (.test) + Solusi Focus Trap Shadcn Sheet
        const textArea = document.createElement('textarea');
        textArea.value = value;

        // Buat tidak terlihat tapi tetap berada di dalam hierarki komponen
        textArea.style.position = 'absolute';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';

        // PERUBAHAN UTAMA: Masukkan ke dalam elemen tombol saat ini (e.currentTarget)
        // Dengan begini, posisi teks tiruan ada DI DALAM Sheet, sehingga LOLOS dari Focus Trap
        e.currentTarget.appendChild(textArea);

        textArea.select();
        textArea.setSelectionRange(0, 99999); // Ekstra support untuk browser HP
        document.execCommand('copy');

        // Hapus kembali dari dalam tombol setelah selesai disalin
        e.currentTarget.removeChild(textArea);
      }

      // Jalankan animasi centang
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
      // Ditambahkan class 'relative' agar textarea absolute aman di dalam scope button
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

export default function Transactions({ transactions, storesList, productsList, filters }: any) {
  const [search, setSearch] = useState(filters?.search || '');
  const [storeFilter, setStoreFilter] = useState(filters?.store_id || 'all');
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // State Pilihan Checkbox (Bulk Action)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // State Form fields Terkontrol untuk Select Dropdown & Dynamic Items
  const [storeId, setStoreId] = useState<string>('');
  const [status, setStatus] = useState<string>('pending');

  // ---- DISKON BERFORMAT RUPIAH ----
  const [rawDiscount, setRawDiscount] = useState('');
  const [displayDiscount, setDisplayDiscount] = useState('');

  // Modifikasi items awal untuk menampung display rupiah
  const [items, setItems] = useState<any[]>([
    { product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }
  ]);

  // Fungsi Mendapatkan Waktu Sekarang Sesuai Zona Waktu Lokal secara Akurat
  const getLocalDatetimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Reset pilihan ceklis saat data transaksi berubah dari server
  useEffect(() => {
    setSelectedIds([]);
  }, [transactions]);

  // SINKRONISASI AGAR DATA DI DALAM SHEET DETAIL SELALU UPDATE OTOMATIS
  useEffect(() => {
    if (selectedTransaction) {
      // Cari data transaksi terbaru dari props berdasarkan ID transaksi yang sedang dibuka
      const freshData = transactions.data.find((tx: any) => tx.id === selectedTransaction.id);
      if (freshData) {
        setSelectedTransaction(freshData);
      }
    }
  }, [transactions.data]); // Efek ini berjalan setiap kali ada data baru dari server

  // Debounce filter server-side
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

  // Handler Ceklis Massal
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
      status: newStatus
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedIds([]); // Reset checkbox setelah berhasil
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

  // Fungsi Aksi Massal: Export Excel Terpilih
  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const idsQuery = selectedIds.join(',');
    window.location.href = `/finance/transactions/export?ids=${idsQuery}`;
  };

  // Manajemen Baris Item Produk Dinamis Dalam Form Manual
  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // ---- HANDLER FORMAT RUPIAH PADA DISKON ----
  const handleDiscountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setRawDiscount(numericValue);
    setDisplayDiscount(numericValue ? new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10)) : '');
  };

  // ---- HANDLER DINAMIS INPUT PRODUK & HARGA JUAL ----
  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...items];

    if (field === 'selling_price') {
      // Jika user mengetik manual harga jual di row item
      const numericValue = value.replace(/\D/g, '');
      updatedItems[index]['selling_price'] = numericValue;
      updatedItems[index]['display_selling_price'] = numericValue
        ? new Intl.NumberFormat('id-ID').format(parseInt(numericValue, 10))
        : '';
    } else if (field === 'product_id') {
      // Otomatisasi Harga Jual Master Produk saat produk dipilih dari Dropdown
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

  const resetForm = () => {
    setStoreId('');
    setStatus('pending');
    setRawDiscount('');
    setDisplayDiscount('');
    setItems([{ product_id: '', quantity: 1, selling_price: '', display_selling_price: '' }]);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { dateStr: '-', timeStr: '-' };

    // PERBAIKAN: Jika string berakhiran 'Z', potong huruf Z-nya 
    // agar JavaScript menganggapnya sebagai waktu lokal murni tanpa konversi UTC
    const cleanDateString = dateString.endsWith('Z')
      ? dateString.slice(0, -1)
      : dateString;

    const date = new Date(cleanDateString);
    const dateStr = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit', // Menampilkan sampai detik agar presisi
    }).replace('.', ':');

    return { dateStr, timeStr };
  };

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
    ? (parseFloat(selectedTransaction.grand_total) - parseFloat(selectedTransaction.marketplace_admin_fee) - totalHppSnapshotSum)
    : 0;

  return (
    <>
      <Head title="Data Transaksi" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        <div className="flex items-center justify-between">
          <Heading
            title="Riwayat Transaksi"
            description="Manajemen data penjualan dari seluruh platform marketplace terintegrasi."
          />
          <div className="flex flex-wrap gap-2">
            <Sheet open={isCreateSheetOpen} onOpenChange={(open) => {
              setIsCreateSheetOpen(open);
              if (!open) resetForm();
            }}>
              <Button onClick={() => setIsCreateSheetOpen(true)} className="gap-1.5 capitalize">
                <Plus className="h-4 w-4" /> Tambah Transaksi
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
                    setIsCreateSheetOpen(false);
                    resetForm();
                    setFormKey((prev) => prev + 1);
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
                            <Input id="invoice_number" name="invoice_number" placeholder="Contoh: 260001247..." className="bg-background" required />
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
                            <Input id="transaction_date" name="transaction_date" type="datetime-local" defaultValue={getLocalDatetimeString()} className="bg-background" required />
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
                          {/* Melempar nilai numerik bersih ke Laravel Form Request */}
                          <input type="hidden" name="discount" value={rawDiscount} />
                          <InputError message={errors.discount} />
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
                            {items.map((item, index) => (
                              <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/10 relative group">
                                <div className="col-span-6 grid gap-1.5">
                                  <Label className="text-[11px] text-muted-foreground">Produk</Label>
                                  <Select value={item.product_id} onValueChange={(v) => handleItemChange(index, 'product_id', v)}>
                                    <SelectTrigger className="w-full bg-background">
                                      <SelectValue placeholder="Pilih Produk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {productsList?.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <input type="hidden" name={`items[${index}][product_id]`} value={item.product_id} />
                                </div>

                                <div className="col-span-2 grid gap-1.5">
                                  <Label className="text-[11px] text-muted-foreground">Qty</Label>
                                  <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} name={`items[${index}][quantity]`} className="bg-background px-2" required />
                                </div>

                                <div className="col-span-3 grid gap-1.5">
                                  <Label className="text-[11px] text-muted-foreground">Harga Jual (Rp)</Label>
                                  <Input
                                    type="text"
                                    placeholder="0"
                                    value={item.display_selling_price || ''}
                                    onChange={(e) => handleItemChange(index, 'selling_price', e.target.value)}
                                    className="bg-background px-2"
                                    required
                                  />
                                  {/* Melempar nilai numerik bersih terindeks sesuai skema array items manual Laravel */}
                                  <input type="hidden" name={`items[${index}][selling_price]`} value={item.selling_price} />
                                </div>

                                <div className="col-span-1 flex justify-center pb-1">
                                  <Button type="button" variant="ghost" size="icon" disabled={items.length === 1} onClick={() => handleRemoveItem(index)} className="text-destructive size-8 hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* PEMBARUAN LOGIKA: Diberikan 'col-span-12' agar letak error turun ke bawah row secara rapi */}
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
                            ))}
                          </div>
                        </div>
                      </div>

                      <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                        <Button type="submit" disabled={processing}>
                          {processing ? 'Menyimpan...' : 'Simpan Transaksi'}
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
          </div>
        </div>

        {/* BARIS SEKSI FILTER */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full bg-card p-3 rounded-lg border border-sidebar-border/60">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Semua Toko" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {storesList?.map((store: any) => <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full max-w-sm sm:ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Cari No. Pesanan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* TABEL DATA UTAMA */}
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
                        {/* Checkbox Massal */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(tx.id, !!checked)}
                            aria-label={`Select row ${tx.invoice_number}`}
                          />
                        </TableCell>

                        {/* CELL GAMBAR DENGAN HOVER PREVIEW */}
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
                    onClick={() => transactions.prev_page_url && router.get(transactions.prev_page_url, {}, { preserveState: true })}
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
                    onClick={() => transactions.next_page_url && router.get(transactions.next_page_url, {}, { preserveState: true })}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= FLOATING ACTION BAR HAPUS MASSAL ================= */}
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

            {/* PEMBARUAN: DROPDOWN UBAH STATUS MASSAL */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs h-8 border-blue-600/30 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
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
                  className="rounded-full gap-1.5 text-xs h-8 bg-red-600 hover:bg-red-700 animate-none"
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

      {/* ================= DETAIL TRANSAKSI SHEET ================= */}
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
                      // Panggil route patch untuk single id
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
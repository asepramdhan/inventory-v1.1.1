/* eslint-disable curly */
/* eslint-disable @stylistic/padding-line-between-statements */
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, CheckCircle2, DollarSign, History, Plus, Receipt, Text, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceItem {
  id: number;
  item_name: string;
  quantity: number;
  cost_per_item: number;
  subtotal: number;
}

interface PaymentRecord {
  id: number;
  date: string;
  created_at: string;
  amount: number;
  description: string | null;
  account?: {
    id: number;
    name: string;
    type: string;
  };
}

interface Invoice {
  id: number;
  producer_name: string;
  invoice_number: string;
  received_date: string;
  created_at: string;
  total_amount: number;
  paid_amount: number;
  status: 'unpaid' | 'paid';
  paid_date: string | null;
  description: string | null;
  items: InvoiceItem[];
  payments: PaymentRecord[];
}

interface Account {
  id: number;
  name: string;
  type: string;
  current_balance: number;
}

interface MasterProducer {
  id: number;
  name: string;
}

interface Props {
  invoices: Invoice[];
  accounts: Account[];
  totalUnpaid: number;
  masterProducers: MasterProducer[];
}

// --- KOMPONEN SKELETON KHUSUS TABEL (DISAMAKAN PRESISI 100% DENGAN TABEL ASLI) ---
function ProducerStocksTableSkeleton() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 animate-pulse">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30">
            <TableRow>
              <TableHead className="w-[130px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Tgl Datang</TableHead>
              <TableHead className="w-[180px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Produsen</TableHead>
              <TableHead className="w-[140px] text-xs font-bold text-zinc-500 dark:text-zinc-400">No. Nota</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Rincian Barang</TableHead>
              <TableHead className="w-[130px] text-right text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Tagihan</TableHead>
              <TableHead className="w-[120px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Status</TableHead>
              <TableHead className="w-[110px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Membuat 3 baris loading palsu */}
            {[1, 2, 3].map((i) => (
              <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                {/* Tgl Datang */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                    <div className="h-3 bg-zinc-105 dark:bg-zinc-800 rounded w-24" />
                  </div>
                </TableCell>

                {/* Produsen */}
                <TableCell>
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-28 font-bold" />
                </TableCell>

                {/* No. Nota */}
                <TableCell>
                  <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-24 font-mono" />
                </TableCell>

                {/* Rincian Barang (Meniru box barang bawaan Anda) */}
                <TableCell className="py-2">
                  <div className="flex flex-col gap-1 max-w-[320px]">
                    <div className="h-6 bg-zinc-105 dark:bg-zinc-800 rounded w-full border border-zinc-200/50 dark:border-zinc-800/80" />
                    <div className="h-6 bg-zinc-105 dark:bg-zinc-800 rounded w-4/5 border border-zinc-200/50 dark:border-zinc-800/80" />
                    <div className="h-3 bg-zinc-105 dark:bg-zinc-800 rounded w-1/2 mt-0.5 italic" />
                  </div>
                </TableCell>

                {/* Total Tagihan */}
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20 font-extrabold" />
                    {i === 1 && <div className="h-2.5 bg-zinc-105 dark:bg-zinc-800 rounded w-16" />} {/* Simulasi teks sisa cicilan */}
                  </div>
                </TableCell>

                {/* Status Badges */}
                <TableCell className="text-center">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-16 mx-auto" />
                </TableCell>

                {/* Aksi Button */}
                <TableCell className="text-center py-2">
                  <div className="h-7 bg-zinc-200 dark:bg-zinc-700 rounded w-16 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ProducerStocks({ invoices, accounts, totalUnpaid, masterProducers }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // State untuk inline edit catatan nota langsung di tabel
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>('');

  // States untuk filter produsen, status, dan pencarian
  const [selectedProducerName, setSelectedProducerName] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter tagihan di sisi klien
  const filteredInvoices = invoices.filter((inv) => {
    const matchProducer = selectedProducerName === 'all' || inv.producer_name === selectedProducerName;
    const matchStatus = selectedStatus === 'all' || 
      (selectedStatus === 'paid' && inv.status === 'paid') ||
      (selectedStatus === 'unpaid' && inv.status === 'unpaid');
    const matchQuery = searchQuery.trim() === '' || 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.description && inv.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.items?.some(item => item.item_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchProducer && matchStatus && matchQuery;
  });

  // Hitung dinamis total sisa hutang berdasarkan filter
  const dynamicTotalUnpaid = filteredInvoices.reduce((acc, inv) => {
    if (inv.status === 'unpaid') {
      return acc + (inv.total_amount - (inv.paid_amount || 0));
    }
    return acc;
  }, 0);

  // --- TAMBAHKAN STATE & EFFECT SKELETON DI SINI ---
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Beri jeda waktu mini (misal 350 milidetik) agar animasinya kelihatan mulus
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      setIsCreateOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  // -------------------------------------------------

  // Helper Formatter Rupiah untuk Tampilan Tabel & Widget
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
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

  const getPaymentTypeLabel = (description: string | null) => {
    if (description?.includes('Pelunasan Akhir')) return 'Pelunasan Akhir';
    if (description?.includes('Pembayaran Sebagian')) return 'Cicilan';
    return 'Pembayaran';
  };

  const handleOpenDetailModal = (invoice: Invoice) => {
    setDetailInvoice(invoice);
    setIsDetailOpen(true);
  };

  // Helper Masking Rupiah saat Mengetik di Inputan Form
  const formatDisplayRupiah = (value: string | number) => {
    if (!value) return '';
    const stringValue = value.toString().replace(/\D/g, '');
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const cleanRupiahValue = (value: string) => {
    return value.replace(/\./g, '');
  };

  // --- FORM 1: INPUT NOTA MASUK BARU ---
  const createForm = useForm({
    producer_id: '',
    invoice_number: '',
    received_date: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    description: '',
    items: [{ item_name: '', quantity: '1', cost_per_item: '' }],
  });

  const handleAddItemRow = () => {
    createForm.setData('items', [
      ...createForm.data.items,
      { item_name: '', quantity: '1', cost_per_item: '' }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    const updatedItems = [...createForm.data.items];
    updatedItems.splice(index, 1);
    createForm.setData('items', updatedItems);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...createForm.data.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    createForm.setData('items', updatedItems);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/operational/producer-stocks', {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
      },
    });
  };

  const [rawPayAmount, setRawPayAmount] = useState('');
  const [displayPayAmount, setDisplayPayAmount] = useState('');

  // --- FORM 2: PELUNASAN MINGGUAN ---
  const payForm = useForm({
    financial_account_id: '',
    paid_date: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    amount_to_pay: '',
  });

  const handleOpenPayModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    payForm.setData('financial_account_id', '');

    // Set default nilai input ke sisa tagihan
    const sisa = invoice.total_amount - (invoice.paid_amount || 0);
    setRawPayAmount(sisa.toString());
    setDisplayPayAmount(formatDisplayRupiah(sisa));

    setIsPayOpen(true);
  };

  const handleOpenCreateModal = async () => {
    try {
      // Ambil nomor nota otomatis dari backend
      const response = await fetch('/operational/producer-stocks/generate-number');
      const data = await response.json();

      // Set nomor otomatis tersebut ke form data
      createForm.setData('invoice_number', data.invoice_number);
    } catch (error) {
      console.error("Gagal mengambil nomor nota otomatis", error);
    }
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    // SUNTIKKAN LANGSUNG NOMINALNYA KE FORM DATA SEBELUM DI-POST
    payForm.setData('amount_to_pay', rawPayAmount);

    // Gunakan gaya lama Anda yang aman tanpa kurung transform yang bikin error
    payForm.post(`/operational/producer-stocks/${selectedInvoice.id}/pay`, {
      onSuccess: () => {
        setIsPayOpen(false);
        setSelectedInvoice(null);
        setRawPayAmount('');
        setDisplayPayAmount('');
        payForm.reset();
      },
    });
  };

  const handleSaveInlineNote = (invoiceId: number) => {
    // Kirim data menggunakan router Inertia ke endpoint baru
    router.put(`/operational/producer-stocks/${invoiceId}/update-note`, {
      description: editingNoteValue,
    }, {
      preserveScroll: true, // Agar halaman tidak nge-scroll kembali ke atas setelah simpan
      onSuccess: () => {
        setEditingInvoiceId(null); // Tutup mode input kembali ke teks biasa
      }
    });
  };

  return (
    <>
      <Head title="Pemasukan Stok Produsen" />
      <div className="flex flex-col gap-4 p-4">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 mb-2">
          <Heading
            title="Pemasukan Stok Produsen"
            description="Catat nota kedatangan barang konveksi/produsen dengan sistem tagihan mingguan."
          />

          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <Button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 w-full sm:w-auto shadow-sm">
                <Plus className="h-4 w-4" /> Catat Nota Masuk
              </Button>
            </SheetTrigger>

            {/* SHEET FORM INPUT NOTA BARU */}
            <SheetContent className="flex flex-col h-full sm:max-w-xl p-0 gap-0">
              <SheetHeader className="p-6 border-b bg-background">
                <SheetTitle>Pencatatan Nota Produsen</SheetTitle>
                <SheetDescription>Masukkan detail data pengiriman barang dari produsen dan nilai hutang temponya.</SheetDescription>
              </SheetHeader>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="producer_id">Pilih Produsen / Konveksi</Label>
                    <Select
                      value={createForm.data.producer_id}
                      onValueChange={(val) => createForm.setData('producer_id', val)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Pilih mitra produsen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {masterProducers?.map((mProd) => (
                          <SelectItem key={mProd.id} value={mProd.id.toString()} className="text-xs">
                            🏢 {mProd.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={createForm.errors.producer_id} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="invoice_number">Nomor Nota / Faktur</Label>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="text-[10px] text-emerald-600 hover:underline font-bold"
                      >
                        🔄 Generate Otomatis
                      </button>
                    </div>
                    <div className="relative">
                      <Receipt className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invoice_number"
                        placeholder="Contoh: INV-1024"
                        className="pl-9 bg-muted/30 font-mono text-xs" // Dibuat bergaya kode/mono agar rapi
                        value={createForm.data.invoice_number}
                        onChange={(e) => createForm.setData('invoice_number', e.target.value)}
                      />
                    </div>
                    <InputError message={createForm.errors.invoice_number} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="received_date">Tanggal Barang Diterima</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      id="received_date"
                      className="pl-9"
                      value={createForm.data.received_date}
                      onChange={(e) => createForm.setData('received_date', e.target.value)}
                    />
                  </div>
                  <InputError message={createForm.errors.received_date} />
                </div>

                {/* AREA DINAMIS TAMBAH BARANG */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <Label className="font-bold text-xs text-blue-600">Daftar Rincian Barang Masuk</Label>
                    <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] gap-1 px-2 border-dashed" onClick={handleAddItemRow}>
                      <Plus className="h-3 w-3" /> Tambah Baris
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {createForm.data.items.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 border bg-muted/20 p-2.5 rounded-md relative group">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Nama Barang / Varian</Label>
                          <Input
                            placeholder="Gamis Polos L, Kemeja X..."
                            className="h-8 text-xs"
                            value={item.item_name}
                            onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                          />
                        </div>
                        <div className="w-[70px] space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Qty (Pcs)</Label>
                          <Input
                            type="number"
                            className="h-8 text-xs"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          />
                        </div>
                        <div className="w-[140px] space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Harga Modal (Rp)</Label>
                          <Input
                            type="text"
                            className="h-8 text-xs"
                            placeholder="50.000"
                            value={formatDisplayRupiah(item.cost_per_item)}
                            onChange={(e) => handleItemChange(idx, 'cost_per_item', cleanRupiahValue(e.target.value))}
                          />
                        </div>
                        {createForm.data.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                            onClick={() => handleRemoveItemRow(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <InputError message={createForm.errors.items} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Keterangan / Catatan Tambahan (Opsional)</Label>
                  <div className="relative">
                    <Text className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="description"
                      rows={2}
                      placeholder="Catatan tambahan mengenai kondisi kiriman barang..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={createForm.data.description}
                      onChange={(e) => createForm.setData('description', e.target.value)}
                    />
                  </div>
                </div>

                <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                  <Button type="submit" disabled={createForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    {createForm.processing ? 'Menyimpan...' : 'Simpan Nota Masuk'}
                  </Button>
                  <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* WIDGET TOTAL HUTANG JATUH TEMPO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm group">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-5 flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hutang Produsen Belum Lunas</span>
              <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-transform duration-300">
                <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {isLoading ? <Skeleton className="h-8 w-[200px]" /> : formatIDR(dynamicTotalUnpaid)}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                {selectedProducerName === 'all' 
                  ? 'Total Tagihan Semua Produsen' 
                  : `Total Tagihan ${selectedProducerName}`}
              </p>
            </div>
          </div>
        </div>


        {/* FILTER & SEARCH BAR */}
        {!isLoading && (
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-zinc-50/40 dark:bg-zinc-900/30 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Filter Produsen */}
              <div className="w-full sm:w-[220px]">
                <Select
                  value={selectedProducerName}
                  onValueChange={(val) => setSelectedProducerName(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Semua Produsen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">🏢 Semua Produsen</SelectItem>
                    {masterProducers?.map((mProd) => (
                      <SelectItem key={mProd.id} value={mProd.name} className="text-xs">
                        🏢 {mProd.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Status */}
              <div className="w-full sm:w-[160px]">
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">🏷️ Semua Status</SelectItem>
                    <SelectItem value="unpaid" className="text-xs text-red-600 dark:text-red-400 font-medium">🔴 Belum Lunas</SelectItem>
                    <SelectItem value="paid" className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">🟢 Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-[280px]">
              <Input
                type="text"
                placeholder="Cari No. Nota atau nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>
        )}

        {/* LOGIKA SINKRONISASI LOADING SKELETON */}
        {isLoading ? (
          <ProducerStocksTableSkeleton />
        ) : (
          /* DATA UTAMA TABEL NOTA */
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
            <div className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                  <TableRow>
                    <TableHead className="w-[130px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Tgl Datang</TableHead>
                    <TableHead className="w-[180px] text-xs font-bold text-zinc-500 dark:text-zinc-400">Produsen</TableHead>
                    <TableHead className="w-[140px] text-xs font-bold text-zinc-500 dark:text-zinc-400">No. Nota</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Rincian Barang</TableHead>
                    <TableHead className="w-[130px] text-right text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Tagihan</TableHead>
                    <TableHead className="w-[120px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Status</TableHead>
                    <TableHead className="w-[110px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-muted-foreground text-sm">
                        {invoices.length === 0 
                          ? 'Belum ada rincian catatan pemasukan stok produsen.' 
                          : 'Tidak ada catatan nota yang sesuai dengan filter.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <TableRow
                        key={inv.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer border-b border-zinc-100 dark:border-zinc-800/60"
                        onClick={() => handleOpenDetailModal(inv)}
                      >
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-foreground">
                              {formatDateTime(inv.received_date).dateStr}
                            </span>
                            <span className="text-[11px] text-muted-foreground italic">
                              Pukul {formatDateTime(inv.created_at).timeStr} WIB
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">{inv.producer_name}</TableCell>
                        <TableCell className="text-xs font-mono font-medium text-muted-foreground">{inv.invoice_number}</TableCell>

                        {/* RINCIAN LIST BARANG DI DALAM CELL TABEL (BISA EDIT NOTE LANGSUNG) */}
                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1 max-w-[320px]">
                            {inv.items?.map((item) => (
                              <div key={item.id} className="text-[11px] bg-muted/40 px-1.5 py-0.5 rounded flex justify-between items-center border border-muted/20">
                                <span className="font-medium truncate mr-2">{item.item_name}</span>
                                <span className="text-muted-foreground shrink-0">{item.quantity} pcs × {formatIDR(item.cost_per_item)}</span>
                              </div>
                            ))}

                            {/* LOGIKA INTERAKTIF EDIT NOTE */}
                            {editingInvoiceId === inv.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  className="text-[11px] px-1.5 py-0.5 border rounded w-full bg-background font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  value={editingNoteValue}
                                  onChange={(e) => setEditingNoteValue(e.target.value)}
                                  placeholder="Tulis catatan... (Kosongkan untuk hapus)"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineNote(inv.id);
                                    if (e.key === 'Escape') setEditingInvoiceId(null);
                                  }}
                                  onBlur={() => handleSaveInlineNote(inv.id)} // Otomatis simpan kalau user klik area luar
                                />
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingInvoiceId(inv.id);
                                  setEditingNoteValue(inv.description || '');
                                }}
                                className="group flex items-center gap-1 mt-0.5 cursor-pointer rounded hover:bg-amber-500/5 p-0.5 transition-colors"
                                title="Klik untuk ubah catatan"
                              >
                                {inv.description ? (
                                  <span className="text-[10px] text-amber-600 italic">
                                    Note: {inv.description}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 italic opacity-0 group-hover:opacity-100 transition-opacity">
                                    + Tambah catatan kecil...
                                  </span>
                                )}
                                <span className="text-[9px] text-muted-foreground/40 hidden group-hover:inline ml-1">✏️</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* TAMPILAN SISA TAGIHAN */}
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-extrabold text-foreground">{formatIDR(inv.total_amount)}</span>
                            {(inv.paid_amount > 0 && inv.status === 'unpaid') && (
                              <span className="text-[10px] text-amber-600 font-bold mt-0.5">
                                Sisa: {formatIDR(inv.total_amount - inv.paid_amount)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* STATUS BADGE */}
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-2xs ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : inv.paid_amount > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' // Status Cicilan
                              : 'bg-red-500/10 text-red-600 border border-red-500/20'
                            }`}>
                            {inv.status === 'paid' ? 'LUNAS' : inv.paid_amount > 0 ? 'DICICIL' : 'BELUM BAYAR'}
                          </span>
                        </TableCell>

                        {/* TOMBOL PELUNASAN */}
                        <TableCell className="text-center py-2" onClick={(e) => e.stopPropagation()}>
                          {inv.status === 'unpaid' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-bold text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                              onClick={() => handleOpenPayModal(inv)}
                            >
                              💰 Lunasi
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Beres
                            </span>
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

        {/* SHEET DETAIL NOTA & RIWAYAT PEMBAYARAN */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="flex flex-col h-full sm:max-w-lg p-0 gap-0">
            <SheetHeader className="p-6 border-b bg-background">
              <SheetTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                Detail Nota & Riwayat Pembayaran
              </SheetTitle>
              <SheetDescription>
                Klik baris tabel untuk melihat rincian nota dan histori cicilan maupun pelunasan.
              </SheetDescription>
            </SheetHeader>

            {detailInvoice && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="bg-muted/40 p-4 rounded-lg border space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Produsen</p>
                      <p className="text-sm font-bold text-foreground">{detailInvoice.producer_name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${detailInvoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : detailInvoice.paid_amount > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                      {detailInvoice.status === 'paid' ? 'LUNAS' : detailInvoice.paid_amount > 0 ? 'DICICIL' : 'BELUM BAYAR'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">No. Nota</p>
                      <p className="text-xs font-mono font-semibold">{detailInvoice.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Tgl Barang Datang</p>
                      <p className="text-xs font-medium">
                        {formatDateTime(detailInvoice.received_date).dateStr}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total Tagihan</p>
                      <p className="text-xs font-bold">{formatIDR(detailInvoice.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Sudah Dibayar</p>
                      <p className="text-xs font-bold text-emerald-600">{formatIDR(detailInvoice.paid_amount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Sisa</p>
                      <p className="text-xs font-bold text-red-600">{formatIDR(detailInvoice.total_amount - (detailInvoice.paid_amount || 0))}</p>
                    </div>
                  </div>
                  {detailInvoice.description && (
                    <p className="text-[11px] text-amber-600 italic pt-1 border-t border-dashed">
                      Catatan: {detailInvoice.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">Rincian Barang ({detailInvoice.items?.length || 0})</p>
                  <div className="border rounded-lg overflow-hidden">
                    {detailInvoice.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-[11px] px-3 py-2 border-b last:border-b-0 bg-muted/20">
                        <span className="font-medium truncate mr-2">{item.item_name}</span>
                        <span className="text-muted-foreground shrink-0">{item.quantity} pcs × {formatIDR(item.cost_per_item)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Riwayat Pembayaran</p>
                    <span className="text-[10px] text-muted-foreground">{detailInvoice.payments?.length || 0} transaksi</span>
                  </div>

                  {detailInvoice.payments?.length > 0 ? (
                    <div className="space-y-0">
                      {detailInvoice.payments.map((payment, index) => {
                        const paymentType = getPaymentTypeLabel(payment.description);
                        const isFinal = paymentType === 'Pelunasan Akhir';

                        return (
                          <div key={payment.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`h-3 w-3 rounded-full border-2 shrink-0 ${isFinal ? 'bg-emerald-500 border-emerald-500' : 'bg-amber-400 border-amber-400'}`} />
                              {index < detailInvoice.payments.length - 1 && (
                                <div className="w-px flex-1 bg-border my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-foreground">
                                    {formatDateTime(payment.date).dateStr}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground italic">
                                    Pukul {formatDateTime(payment.created_at).timeStr} WIB
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFinal
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-amber-500/10 text-amber-600'
                                  }`}>
                                  {paymentType}
                                </span>
                              </div>
                              <p className="text-sm font-black text-emerald-600 mt-1">{formatIDR(payment.amount)}</p>
                              {payment.account && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  via {payment.account.name} ({payment.account.type.toUpperCase()})
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-lg p-6 text-center">
                      <History className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Belum ada riwayat pembayaran untuk nota ini.</p>
                      {detailInvoice.status === 'unpaid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 h-7 text-[11px] font-bold text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                          onClick={() => {
                            setIsDetailOpen(false);
                            handleOpenPayModal(detailInvoice);
                          }}
                        >
                          💰 Lunasi Sekarang
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <SheetFooter className="p-4 border-t flex-row gap-2 justify-end">
              {detailInvoice?.status === 'unpaid' && detailInvoice.payments?.length > 0 && (
                <Button
                  variant="outline"
                  className="text-xs font-bold text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenPayModal(detailInvoice);
                  }}
                >
                  💰 Tambah Pembayaran
                </Button>
              )}
              <SheetClose asChild>
                <Button variant="outline" type="button" className="text-xs">Tutup</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* SHEET MODAL UNTUK KLIK PELUNASAN MINGGUAN */}
        <Sheet open={isPayOpen} onOpenChange={setIsPayOpen}>
          <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
            <SheetHeader className="p-6 border-b bg-background">
              <SheetTitle>Konfirmasi Pelunasan Mingguan</SheetTitle>
              <SheetDescription>Pilih akun kas keuangan yang digunakan untuk membayar tagihan produsen ini.</SheetDescription>
            </SheetHeader>

            {selectedInvoice && (
              <form onSubmit={handlePaySubmit} className="flex-1 p-6 space-y-4">
                <div className="bg-muted/40 p-3 rounded-md space-y-1.5 border">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Nama Produsen:</span>
                    <span className="font-bold text-foreground">{selectedInvoice.producer_name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Tagihan:</span>
                    <span className="font-medium">{formatIDR(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Telah Dibayar (Cicilan):</span>
                    <span className="font-medium text-emerald-600">{formatIDR(selectedInvoice.paid_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-dashed">
                    <span className="font-semibold text-foreground">SISA TAGIHAN:</span>
                    <span className="font-black text-red-600 text-sm">{formatIDR(selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0))}</span>
                  </div>
                </div>

                {/* Input Baru untuk Cicilan */}
                <div className="space-y-1.5">
                  <Label htmlFor="pay_amount">Nominal Pembayaran Saat Ini (Rp)</Label>
                  <Input
                    id="pay_amount"
                    type="text"
                    className="h-9 text-xs font-bold"
                    value={displayPayAmount}
                    onChange={(e) => {
                      const numericValue = cleanRupiahValue(e.target.value);
                      setRawPayAmount(numericValue);
                      setDisplayPayAmount(formatDisplayRupiah(numericValue));
                    }}
                  />
                  <InputError message={payForm.errors.amount_to_pay as string} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="financial_account_id">Pilih Kas Sumber Dana Pembayaran</Label>
                  <Select
                    value={payForm.data.financial_account_id}
                    onValueChange={(val) => payForm.setData('financial_account_id', val)}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Pilih rekening bank / dompet utama..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id.toString()} className="text-xs">
                          {acc.name} ({acc.type.toUpperCase()}) - Saldo: {formatIDR(acc.current_balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <InputError message={payForm.errors.financial_account_id} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paid_date">Tanggal Melakukan Pembayaran</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      id="paid_date"
                      className="pl-9 h-9 text-xs"
                      value={payForm.data.paid_date}
                      onChange={(e) => payForm.setData('paid_date', e.target.value)}
                    />
                  </div>
                  <InputError message={payForm.errors.paid_date} />
                </div>

                <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                  <Button type="submit" disabled={payForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    {payForm.processing ? 'Memproses...' : 'Konfirmasi & Potong Kas'}
                  </Button>
                  <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
                </SheetFooter>
              </form>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </>
  );
}

ProducerStocks.layout = {
  breadcrumbs: [
    { title: 'Stok & Pemasukan', href: '#' },
    { title: 'Stok & Nota Produsen', href: '/operational/producer-stocks' },
  ],
};
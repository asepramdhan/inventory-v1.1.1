<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $storeId = $request->input('store_id');
        $status = $request->input('status');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Query transaksi bawa data toko & item produknya
        $transactions = Transaction::with(['store', 'items.product'])
            ->where('user_id', Auth::user()->id)

            // Filter Pencarian (No Invoice atau Nama Produk di dalam item)
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('items', function ($itemQuery) use ($search) {
                            $itemQuery->where('product_name', 'like', "%{$search}%");
                        });
                });
            })

            // Filter Berdasarkan Toko
            ->when($storeId && $storeId !== 'all', function ($query) use ($storeId) {
                return $query->where('store_id', $storeId);
            })

            // Filter Status Transaksi
            ->when($status && $status !== 'all', function ($query) use ($status) {
                return $query->where('status', $status);
            })

            // Filter Berdasarkan Rentang Tanggal
            ->when($startDate, function ($query) use ($startDate) {
                return $query->where('transaction_date', '>=', $startDate . ' 00:00:00');
            })
            ->when($endDate, function ($query) use ($endDate) {
                return $query->where('transaction_date', '<=', $endDate . ' 23:59:59');
            })

            ->latest('transaction_date')
            ->paginate(50)
            ->withQueryString();

        // Hitung jumlah transaksi & total item per toko per status untuk indicator cards & summary table
        $storeStatusCounts = Transaction::where('transactions.user_id', Auth::user()->id)
            ->leftJoin('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->selectRaw('transactions.store_id, transactions.status, COUNT(distinct transactions.id) as count, SUM(transaction_items.quantity) as items')
            ->groupBy('transactions.store_id', 'transactions.status')
            ->get()
            ->groupBy('store_id');

        $storesList = Store::where('user_id', Auth::user()->id)
            ->select('id', 'name', 'platform')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($store) use ($storeStatusCounts) {
                $counts = $storeStatusCounts->get($store->id);
                
                $store->transactions_count = $counts ? (int) $counts->sum('count') : 0;
                $store->items_count = $counts ? (int) $counts->sum('items') : 0;

                $pendingRow = $counts ? $counts->where('status', 'pending')->first() : null;
                $store->pending_count = $pendingRow ? (int) $pendingRow->count : 0;
                $store->pending_items = $pendingRow ? (int) $pendingRow->items : 0;

                $processingRow = $counts ? $counts->where('status', 'processing')->first() : null;
                $store->processing_count = $processingRow ? (int) $processingRow->count : 0;
                $store->processing_items = $processingRow ? (int) $processingRow->items : 0;

                $completedRow = $counts ? $counts->where('status', 'completed')->first() : null;
                $store->completed_count = $completedRow ? (int) $completedRow->count : 0;
                $store->completed_items = $completedRow ? (int) $completedRow->items : 0;

                $cancelledRow = $counts ? $counts->where('status', 'cancelled')->first() : null;
                $store->cancelled_count = $cancelledRow ? (int) $cancelledRow->count : 0;
                $store->cancelled_items = $cancelledRow ? (int) $cancelledRow->items : 0;
                
                return $store;
            });

        // Ambil list produk yang punya HPP untuk form input manual
        $productsList = Product::with('hpp')
            ->where('user_id', Auth::user()->id)
            ->where('active', true)
            ->has('hpp') // Hanya produk yang sudah diset HPP-nya yang bisa dijual
            ->get(['id', 'name', 'sku', 'price', 'stock']);

        // Hitung jumlah transaksi & total item produk per status untuk badge tabs (dinamis terfilter)
        $rawCounts = DB::table('transactions')
            ->leftJoin('transaction_items', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->where('transactions.user_id', Auth::user()->id)

            // Filter Pencarian (No Invoice atau Nama Produk di dalam item)
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('transactions.invoice_number', 'like', "%{$search}%")
                        ->orWhere('transaction_items.product_name', 'like', "%{$search}%");
                });
            })

            // Filter Berdasarkan Toko
            ->when($storeId && $storeId !== 'all', function ($query) use ($storeId) {
                return $query->where('transactions.store_id', $storeId);
            })

            // Filter Berdasarkan Rentang Tanggal
            ->when($startDate, function ($query) use ($startDate) {
                return $query->where('transactions.transaction_date', '>=', $startDate . ' 00:00:00');
            })
            ->when($endDate, function ($query) use ($endDate) {
                return $query->where('transactions.transaction_date', '<=', $endDate . ' 23:59:59');
            })

            ->selectRaw('transactions.status, COUNT(distinct transactions.id) as count, SUM(transaction_items.quantity) as items')
            ->groupBy('transactions.status')
            ->get()
            ->keyBy('status');

        $statusCounts = [
            'all' => [
                'count' => (int) $rawCounts->sum('count'),
                'items' => (int) $rawCounts->sum('items'),
            ],
            'pending' => [
                'count' => (int) ($rawCounts->get('pending')->count ?? 0),
                'items' => (int) ($rawCounts->get('pending')->items ?? 0),
            ],
            'processing' => [
                'count' => (int) ($rawCounts->get('processing')->count ?? 0),
                'items' => (int) ($rawCounts->get('processing')->items ?? 0),
            ],
            'completed' => [
                'count' => (int) ($rawCounts->get('completed')->count ?? 0),
                'items' => (int) ($rawCounts->get('completed')->items ?? 0),
            ],
            'cancelled' => [
                'count' => (int) ($rawCounts->get('cancelled')->count ?? 0),
                'items' => (int) ($rawCounts->get('cancelled')->items ?? 0),
            ],
        ];

        return Inertia::render('finance/transactions', [
            'transactions' => $transactions,
            'storesList' => $storesList,
            'productsList' => $productsList,
            'customersList' => \App\Models\Customer::where('user_id', Auth::user()->id)->orderBy('name', 'asc')->get(['id', 'name', 'username', 'phone', 'platform']),
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $search ?? '',
                'store_id' => $storeId ?? 'all',
                'status' => $status ?? 'all',
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
            ]
        ]);
    }

    // Fungsi Simpan Transaksi Manual
    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_number' => 'required|string|unique:transactions,invoice_number',
            'status' => 'required|string|in:pending,processing,completed,cancelled',
            'transaction_date' => 'required|date',
            'discount' => 'nullable|numeric|min:0',
            'affiliate_fee' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.selling_price' => 'required|numeric|min:0',
            'courier_company' => 'nullable|string|max:255',
            'courier_type' => 'nullable|string|max:255',
            'shipping_cost' => 'nullable|numeric|min:0',
        ]);

        // Cek ketersediaan seluruh stok item sebelum menulis ke database
        // Potong stok diabaikan jika dari awal status transaksi diset "cancelled" (Dibatalkan)
        if ($request->status !== 'cancelled') {
            foreach ($request->items as $index => $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Stok tidak mencukupi! Sisa stok untuk [{$product->name}] hanya {$product->stock} pcs."
                    ]);
                }
            }
        }

        $store = Store::findOrFail($request->store_id);

        DB::transaction(function () use ($request, $store) {
            // 1. Buat Induk Transaksi Sementara
            $transaction = Transaction::create([
                'user_id' => Auth::user()->id,
                'store_id' => $request->store_id,
                'customer_id' => $request->customer_id,
                'invoice_number' => $request->invoice_number,
                'status' => $request->status,
                'subtotal' => 0,
                'discount' => $request->discount ?? 0,
                'affiliate_fee' => $request->affiliate_fee ?? 0,
                'grand_total' => 0,
                'marketplace_admin_fee' => 0,
                'transaction_date' => $request->transaction_date,
                'courier_name' => $request->courier_company,
                'courier_service' => $request->courier_type,
                'shipping_cost' => $request->shipping_cost ?? 0,
            ]);

            $subtotal = 0;

            // 2. Loop, Simpan Item, & Kurangi Stok Produk
            foreach ($request->items as $item) {
                $product = Product::with('hpp')->findOrFail($item['product_id']);
                $itemSubtotal = $item['selling_price'] * $item['quantity'];
                $subtotal += $itemSubtotal;

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'selling_price' => $item['selling_price'],
                    // Kunci HPP saat ini ke dalam snapshot
                    'hpp_purchase_snapshot' => $product->hpp->purchase_price,
                    'hpp_packaging_snapshot' => $product->hpp->packaging_cost,
                    'hpp_operational_snapshot' => $product->hpp->operational_cost,
                    'total_hpp_snapshot' => $product->hpp->total_hpp,
                ]);

                // EKSEKUSI POTONG STOK: Hanya potong stok jika statusnya bukan cancelled
                if ($request->status !== 'cancelled') {
                    $product->decrement('stock', $item['quantity']);
                }
            }

            // 3. Hitung Ulang Grand Total & Biaya Admin Toko Otomatis
            $grandTotal = $subtotal - ($request->discount ?? 0) + ($request->shipping_cost ?? 0);
            $adminFee = ($grandTotal * floatval($store->admin_fee) / 100) + floatval($store->processing_fee);

            // 4. Update Final Data Finansial
            $transaction->update([
                'subtotal' => $subtotal,
                'grand_total' => $grandTotal,
                'marketplace_admin_fee' => $adminFee
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Transaksi manual berhasil disimpan!']);

        return back();
    }

    // Fungsi Ubah Status Transaksi
    public function statusUpdate(Request $request, Transaction $transaction)
    {
        $request->validate([
            'status' => 'required|string|in:completed,processing,pending,cancelled'
        ]);

        $newStatus = $request->status;
        $oldStatus = $transaction->status;

        // Gunakan DB::transaction untuk menjaga keamanan data stok & status
        DB::transaction(function () use ($transaction, $newStatus, $oldStatus) {

            // Eager load items jika belum termuat otomatis
            $transaction->load('items');

            // KONDISI 1: Jika diubah ke 'cancelled' dan status sebelumnya BUKAN 'cancelled'
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                foreach ($transaction->items as $item) {
                    // Kembalikan stok produk
                    DB::table('products')
                        ->where('id', $item->product_id)
                        ->increment('stock', $item->quantity);
                }
            }

            // KONDISI 2: Jika status lama 'cancelled' tapi diaktifkan KEMBALI (ke completed/processing/pending)
            elseif ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                foreach ($transaction->items as $item) {
                    // Potong kembali stok produk karena transaksi aktif lagi
                    DB::table('products')
                        ->where('id', $item->product_id)
                        ->decrement('stock', $item->quantity);
                }
            }

            // Simpan perubahan status transaksi
            $transaction->update(['status' => $newStatus]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Status transaksi #' . $transaction->invoice_number . ' berhasil diperbarui!'
        ]);

        // Menggunakan return back() agar user tetap di halaman/posisi sheet yang sama tanpa hard-reload penuh
        return back();
    }

    // Fungsi Ubah Status Massal Transaksi
    public function bulkStatusUpdate(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'status' => 'required|string|in:completed,processing,pending,cancelled'
        ]);

        $newStatus = $request->status;

        // Gunakan Database Transaction untuk memastikan jika salah satu gagal, semua di-rollback
        DB::transaction(function () use ($request, $newStatus) {

            // Ambil data transaksi yang dipilih beserta item produk di dalamnya
            $transactions = Transaction::with('items')->whereIn('id', $request->ids)->get();

            foreach ($transactions as $transaction) {
                $oldStatus = $transaction->status;

                // KONDISI 1: Jika status diubah MENJADI 'cancelled' dan status sebelumnya BUKAN 'cancelled'
                if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                    foreach ($transaction->items as $item) {
                        // Kembalikan stok ke master produk
                        DB::table('products')
                            ->where('id', $item->product_id)
                            ->increment('stock', $item->quantity);
                    }
                }

                // KONDISI 2 (Antisipasi): Jika status sebelumnya 'cancelled' tapi diubah KEMBALI ke aktif (completed/processing/pending)
                // Maka stok harus dikurangi lagi karena transaksi diaktifkan kembali
                elseif ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                    foreach ($transaction->items as $item) {
                        // Kurangi stok dari master produk
                        DB::table('products')
                            ->where('id', $item->product_id)
                            ->decrement('stock', $item->quantity);
                    }
                }

                // Perbarui status transaksi saat ini
                $transaction->update(['status' => $newStatus]);
            }
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Status transaksi dan stok berhasil diperbarui secara massal!'
        ]);

        return back();
    }

    // Fungsi Hapus Massal Transaksi + Otomatis Mengembalikan Stok
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:transactions,id'
        ]);

        DB::transaction(function () use ($request) {
            // Ambil data transaksi terpilih milik user saat ini beserta relasi itemnya
            $transactions = Transaction::with('items')
                ->where('user_id', Auth::user()->id)
                ->whereIn('id', $request->ids)
                ->get();

            foreach ($transactions as $transaction) {
                // KEMBALIKAN STOK: Hanya jika transaksi lama tersebut statusnya BUKAN cancelled
                // Karena transaksi berstatus cancelled dari awal tidak memotong stok master
                if ($transaction->status !== 'cancelled') {
                    foreach ($transaction->items as $item) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock', $item->quantity);
                        }
                    }
                }

                // Hapus data item terlebih dahulu, lalu hapus record induk transaksi
                $transaction->items()->delete();
                $transaction->delete();
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data transaksi berhasil dihapus & stok produk telah dikembalikan!']);

        return back();
    }

    public function importStatusExcel(Request $request)
    {
        // Tingkatkan execution time & memory limit untuk memproses banyak data
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240', // Maksimal 10MB
        ]);

        $file = $request->file('file');

        try {
            // Load file Excel menggunakan PhpSpreadsheet
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) <= 1) {
                throw ValidationException::withMessages(['file' => 'File Excel kosong atau tidak memiliki baris data.']);
            }

            // 1. Cari index kolom berdasarkan header Shopee
            $headerRow = $rows[0];
            $invoiceIndex = null;
            $statusIndex = null;

            foreach ($headerRow as $index => $headerValue) {
                $cleanHeader = trim($headerValue);
                if ($cleanHeader === 'No. Pesanan') {
                    $invoiceIndex = $index;
                } elseif ($cleanHeader === 'Status Pesanan') {
                    $statusIndex = $index;
                }
            }

            if ($invoiceIndex === null || $statusIndex === null) {
                throw ValidationException::withMessages([
                    'file' => 'Format kolom Excel Shopee tidak dikenali. Pastikan terdapat kolom "No. Pesanan" dan "Status Pesanan".'
                ]);
            }

            $userId = Auth::user()->id;

            // 2. Kumpulkan semua nomor invoice terlebih dahulu
            $invoiceNumbers = [];
            for ($i = 1; $i < count($rows); $i++) {
                $invoiceNumber = trim($rows[$i][$invoiceIndex] ?? '');
                if (!empty($invoiceNumber)) {
                    $invoiceNumbers[] = $invoiceNumber;
                }
            }

            // 3. Ambil data transaksi milik user secara bulk beserta items-nya (1 query saja)
            $transactions = Transaction::with('items')
                ->where('user_id', $userId)
                ->whereIn('invoice_number', $invoiceNumbers)
                ->get()
                ->keyBy('invoice_number');

            $updatedCount = 0;

            // 4. Jalankan seluruh proses update dalam SATU transaksi database besar
            DB::transaction(function () use ($rows, $invoiceIndex, $statusIndex, $transactions, &$updatedCount) {
                for ($i = 1; $i < count($rows); $i++) {
                    $invoiceNumber = trim($rows[$i][$invoiceIndex] ?? '');
                    $shopeeStatus = trim($rows[$i][$statusIndex] ?? '');

                    if (empty($invoiceNumber)) {
                        continue;
                    }

                    // Pemetaan status Shopee
                    $mappedStatus = null;
                    switch (strtolower($shopeeStatus)) {
                        case 'selesai':
                            $mappedStatus = 'completed';
                            break;
                        case 'sedang dikirim':
                        case 'dikirim':
                            $mappedStatus = 'processing';
                            break;
                        case 'batal':
                            $mappedStatus = 'cancelled';
                            break;
                        case 'perlu dikirim':
                            $mappedStatus = 'pending';
                            break;
                    }

                    if ($mappedStatus) {
                        $transaction = $transactions->get($invoiceNumber);

                        // Pastikan transaksi ditemukan dan statusnya memang ada perubahan
                        if ($transaction && $transaction->status !== $mappedStatus) {
                            $oldStatus = $transaction->status;

                            // Sesuaikan stok jika status berubah ke/dari cancelled
                            if ($mappedStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                                foreach ($transaction->items as $item) {
                                    DB::table('products')
                                        ->where('id', $item->product_id)
                                        ->increment('stock', $item->quantity);
                                }
                            } elseif ($oldStatus === 'cancelled' && $mappedStatus !== 'cancelled') {
                                foreach ($transaction->items as $item) {
                                    DB::table('products')
                                        ->where('id', $item->product_id)
                                        ->decrement('stock', $item->quantity);
                                }
                            }

                            // Set status baru
                            $transaction->status = $mappedStatus;

                            // Menggunakan ->save() agar Event booted() di model Transaction terpicu
                            $transaction->save();

                            $updatedCount++;
                        }
                    }
                }
            });

            Inertia::flash('toast', ['type' => 'success', 'message' => "Berhasil memperbarui {$updatedCount} status pesanan dari Excel."]);

            return back();
        } catch (\Exception $e) {
            if ($e instanceof ValidationException) {
                throw $e;
            }
            throw ValidationException::withMessages(['file' => 'Gagal membaca file Excel: ' . $e->getMessage()]);
        }
    }

    public function export(Request $request)
    {
        $request->validate([
            'ids' => 'required|string',
        ]);

        // Mengubah string id kembali menjadi array
        $idsArray = explode(',', $request->ids);

        // Ambil data transaksi milik user yang sedang login (Proteksi IDOR)
        $transactions = Transaction::whereIn('id', $idsArray)
            ->where('user_id', Auth::user()->id)
            ->get();

        // Nama file berakhiran .xlsx
        $fileName = 'Daftar_Transaksi_' . date('Y-m-d_H-i-s') . '.xlsx';

        // 1. Inisialisasi Spreadsheet Baru
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 2. Tulis Header Kolom (Baris 1)
        $sheet->setCellValue('A1', 'Tanggal Transaksi');
        $sheet->setCellValue('B1', 'No. Pesanan');
        $sheet->setCellValue('C1', 'Toko / Platform');
        $sheet->setCellValue('D1', 'Total Bayar');
        $sheet->setCellValue('E1', 'Biaya Admin');
        $sheet->setCellValue('F1', 'Komisi Affiliate');
        $sheet->setCellValue('G1', 'Status');

        // 3. Styling Header agar Tebal (Bold)
        $sheet->getStyle('A1:G1')->getFont()->setBold(true);

        // 4. Looping untuk Mengisi Baris Data (Dimulai dari Baris 2)
        $row = 2;
        foreach ($transactions as $transaction) {
            $sheet->setCellValue('A' . $row, $transaction->created_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue('B' . $row, $transaction->invoice_number);
            $sheet->setCellValue('C' . $row, $transaction->store->name);
            $sheet->setCellValue('D' . $row, $transaction->grand_total);
            $sheet->setCellValue('E' . $row, $transaction->marketplace_admin_fee);
            $sheet->setCellValue('F' . $row, $transaction->affiliate_fee ?? 0);
            $sheet->setCellValue(
                'G' . $row,
                // Jika statusnya 'pending' maka tampilkan 'Menunggu' Jika 'processing' maka tampilkan 'Diproses' Jika 'completed' maka tampilkan 'Selesai' Jika 'cancelled' maka tampilkan 'Dibatalkan'
                $transaction->status === 'pending' ? 'Menunggu' : ($transaction->status === 'processing' ? 'Diproses' : ($transaction->status === 'completed' ? 'Selesai' : 'Dibatalkan'))
            );
            $row++;
        }

        // Tambahkan format rupiah untuk kolom F di bagian bawah bffo format range
        if ($row > 2) {
            $sheet->getStyle('F2:F' . ($row - 1))->getNumberFormat()->setFormatCode('"Rp"#,##0');
            $sheet->getStyle('F2:F' . ($row - 1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
        }

        // 5. Otomatis Mengatur Lebar Kolom (Auto Size) agar tidak terpotong (###) di Excel
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // 6. Siapkan Proses Writer ke format XLSX
        $writer = new Xlsx($spreadsheet);

        // 7. Stream data langsung ke Browser untuk diunduh
        $response = new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        });

        // 8. Atur HTTP Header khusus untuk dokumen Excel (.xlsx)
        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }

    public function importShopeeOrders(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:10240',
            'store_id' => 'required|exists:stores,id',
        ]);

        $file = $request->file('file');
        $storeId = $request->store_id;

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) <= 1) {
                throw ValidationException::withMessages(['file' => 'File Excel kosong atau tidak memiliki baris data.']);
            }

            $headerRow = $rows[0];
            $invoiceIndex = null;
            $statusIndex = null;
            $skuIndex = null;
            $priceIndex = null;
            $quantityIndex = null;
            $subtotalIndex = null;
            $orderDateIndex = null;
            $usernameIndex = null;
            $nameIndex = null;
            $phoneIndex = null;
            $addressIndex = null;
            $waybillIndex = null;

            foreach ($headerRow as $index => $headerValue) {
                $cleanHeader = trim($headerValue);
                if ($cleanHeader === 'No. Pesanan') {
                    $invoiceIndex = $index;
                } elseif ($cleanHeader === 'Status Pesanan') {
                    $statusIndex = $index;
                } elseif ($cleanHeader === 'SKU Induk') {
                    $skuIndex = $index;
                } elseif ($cleanHeader === 'Harga Setelah Diskon') {
                    $priceIndex = $index;
                } elseif ($cleanHeader === 'Jumlah') {
                    $quantityIndex = $index;
                } elseif ($cleanHeader === 'Subtotal Pesanan') {
                    $subtotalIndex = $index;
                } elseif ($cleanHeader === 'Waktu Pesanan Dibuat') {
                    $orderDateIndex = $index;
                } elseif ($cleanHeader === 'Username Pembeli') {
                    $usernameIndex = $index;
                } elseif ($cleanHeader === 'Nama Penerima') {
                    $nameIndex = $index;
                } elseif ($cleanHeader === 'No. Telepon') {
                    $phoneIndex = $index;
                } elseif ($cleanHeader === 'Alamat Pengiriman') {
                    $addressIndex = $index;
                } elseif ($cleanHeader === 'No. Resi' || str_contains(strtolower($cleanHeader), 'no. resi') || str_contains(strtolower($cleanHeader), 'nomor resi')) {
                    $waybillIndex = $index;
                }
            }

            if (
                $invoiceIndex === null || $statusIndex === null || $skuIndex === null ||
                $priceIndex === null || $quantityIndex === null || $subtotalIndex === null
            ) {
                throw ValidationException::withMessages([
                    'file' => 'Format kolom Excel Shopee tidak dikenali. Pastikan terdapat kolom: No. Pesanan, Status Pesanan, SKU Induk, Harga Setelah Diskon, Jumlah, Subtotal Pesanan.'
                ]);
            }

            $userId = Auth::user()->id;
            $store = Store::findOrFail($storeId);
            $importedCount = 0;
            $skippedCount = 0;
            $errorMessages = [];

            DB::transaction(function () use ($rows, $invoiceIndex, $waybillIndex, $statusIndex, $skuIndex, $priceIndex, $quantityIndex, $subtotalIndex, $orderDateIndex, $usernameIndex, $nameIndex, $phoneIndex, $addressIndex, $userId, $storeId, $store, &$importedCount, &$skippedCount, &$errorMessages) {

                $ordersByInvoice = [];

                for ($i = 1; $i < count($rows); $i++) {
                    $invoiceNumber = trim($rows[$i][$invoiceIndex] ?? '');
                    $shopeeStatus = trim($rows[$i][$statusIndex] ?? '');
                    $shopeeSku = trim($rows[$i][$skuIndex] ?? '');
                    $price = floatval(str_replace(['Rp', '.', ','], '', $rows[$i][$priceIndex] ?? 0));
                    $quantity = intval($rows[$i][$quantityIndex] ?? 0);
                    $subtotal = floatval(str_replace(['Rp', '.', ','], '', $rows[$i][$subtotalIndex] ?? 0));
                    $orderDateStr = $orderDateIndex !== null ? trim($rows[$i][$orderDateIndex] ?? '') : '';
                    $waybillNumber = $waybillIndex !== null ? trim($rows[$i][$waybillIndex] ?? '') : null;

                    if (empty($invoiceNumber) || empty($shopeeSku)) {
                        continue;
                    }

                    if (!isset($ordersByInvoice[$invoiceNumber])) {
                        $ordersByInvoice[$invoiceNumber] = [
                            'status' => $shopeeStatus,
                            'order_date' => $orderDateStr,
                            'waybill_number' => $waybillNumber,
                            'customer_username' => $usernameIndex !== null ? trim($rows[$i][$usernameIndex] ?? '') : null,
                            'customer_name' => $nameIndex !== null ? trim($rows[$i][$nameIndex] ?? '') : null,
                            'customer_phone' => $phoneIndex !== null ? trim($rows[$i][$phoneIndex] ?? '') : null,
                            'customer_address' => $addressIndex !== null ? trim($rows[$i][$addressIndex] ?? '') : null,
                            'items' => []
                        ];
                    }

                    $ordersByInvoice[$invoiceNumber]['items'][] = [
                        'shopee_sku' => $shopeeSku,
                        'price' => $price,
                        'quantity' => $quantity,
                        'subtotal' => $subtotal
                    ];
                }

                foreach ($ordersByInvoice as $invoiceNumber => $orderData) {
                    $existingTransaction = Transaction::where('user_id', $userId)
                        ->where('invoice_number', $invoiceNumber)
                        ->first();

                    if ($existingTransaction) {
                        if (empty($existingTransaction->waybill_number) && !empty($orderData['waybill_number'])) {
                            $existingTransaction->update([
                                'waybill_number' => $orderData['waybill_number']
                            ]);
                        }
                        $skippedCount++;
                        continue;
                    }

                    $mappedStatus = null;
                    switch (strtolower($orderData['status'])) {
                        case 'selesai':
                            $mappedStatus = 'completed';
                            break;
                        case 'sedang dikirim':
                        case 'dikirim':
                            $mappedStatus = 'processing';
                            break;
                        case 'batal':
                            $mappedStatus = 'cancelled';
                            break;
                        case 'perlu dikirim':
                            $mappedStatus = 'pending';
                            break;
                    }

                    if (!$mappedStatus) {
                        $errorMessages[] = "Status '{$orderData['status']}' tidak dikenali untuk pesanan {$invoiceNumber}";
                        continue;
                    }

                    $subtotal = 0;
                    $validItems = [];

                    foreach ($orderData['items'] as $item) {
                        $product = Product::where('user_id', $userId)
                            ->where('sku', $item['shopee_sku'])
                            ->with('hpp')
                            ->first();

                        if (!$product) {
                            $errorMessages[] = "Produk dengan SKU '{$item['shopee_sku']}' tidak ditemukan untuk pesanan {$invoiceNumber}";
                            continue;
                        }

                        if ($mappedStatus !== 'cancelled' && $product->stock < $item['quantity']) {
                            $errorMessages[] = "Stok tidak mencukupi untuk produk {$product->name} (SKU: {$item['shopee_sku']}) dalam pesanan {$invoiceNumber}";
                            continue;
                        }

                        $validItems[] = [
                            'product' => $product,
                            'quantity' => $item['quantity'],
                            'selling_price' => $item['price']
                        ];

                        $subtotal += $item['price'] * $item['quantity'];
                    }

                    if (empty($validItems)) {
                        continue;
                    }

                    // --- OTOMATIS SIMPAN & AUTO-MATCHING DATA PELANGGAN ---
                    $customerId = null;
                    $custName = $orderData['customer_name'] ?: ($orderData['customer_username'] ?: 'Pelanggan Shopee');

                    // Cari apakah pelanggan ini sudah ada berdasarkan username atau telepon,
                    // agar data sensor (masked) tidak membuat duplikasi record jika nilainya persis sama.
                    $custQuery = \App\Models\Customer::where('user_id', $userId);
                    
                    if (!empty($orderData['customer_username'])) {
                        $custQuery->where('username', $orderData['customer_username']);
                    } elseif (!empty($orderData['customer_phone'])) {
                        $custQuery->where('phone', $orderData['customer_phone']);
                    } else {
                        $custQuery->where('name', $custName);
                    }

                    $customer = $custQuery->first();

                    if (!$customer) {
                        $customer = \App\Models\Customer::create([
                            'user_id' => $userId,
                            'name' => $custName,
                            'username' => $orderData['customer_username'] ?: null,
                            'phone' => $orderData['customer_phone'] ?: null,
                            'address' => $orderData['customer_address'] ?: null,
                            'platform' => 'shopee',
                        ]);
                    } else {
                        // Jika sudah ada tapi alamatnya kosong, bantu update dengan alamat terbaru
                        if (empty($customer->address) && !empty($orderData['customer_address'])) {
                            $customer->update(['address' => $orderData['customer_address']]);
                        }
                    }
                    $customerId = $customer->id;
                    // ----------------------------------------------------------------------

                    // Parse order date from Excel (format: YYYY-MM-DD HH:MM)
                    $transactionDate = now();
                    if (!empty($orderData['order_date'])) {
                        try {
                            $transactionDate = \Carbon\Carbon::parse($orderData['order_date']);
                        } catch (\Exception $e) {
                            $transactionDate = now();
                        }
                    }

                    $transaction = Transaction::create([
                        'user_id' => $userId,
                        'store_id' => $storeId,
                        'customer_id' => $customerId, // Tautkan customer
                        'invoice_number' => $invoiceNumber,
                        'waybill_number' => $orderData['waybill_number'] ?: null,
                        'status' => $mappedStatus,
                        'subtotal' => $subtotal,
                        'discount' => 0,
                        'affiliate_fee' => 0,
                        'grand_total' => $subtotal,
                        'marketplace_admin_fee' => 0,
                        'transaction_date' => $transactionDate,
                    ]);

                    foreach ($validItems as $item) {
                        $product = $item['product'];

                        TransactionItem::create([
                            'transaction_id' => $transaction->id,
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'product_sku' => $product->sku,
                            'quantity' => $item['quantity'],
                            'selling_price' => $item['selling_price'],
                            'hpp_purchase_snapshot' => $product->hpp->purchase_price ?? 0,
                            'hpp_packaging_snapshot' => $product->hpp->packaging_cost ?? 0,
                            'hpp_operational_snapshot' => $product->hpp->operational_cost ?? 0,
                            'total_hpp_snapshot' => $product->hpp->total_hpp ?? 0,
                        ]);

                        if ($mappedStatus !== 'cancelled') {
                            $product->decrement('stock', $item['quantity']);
                        }
                    }

                    $adminFee = ($subtotal * floatval($store->admin_fee) / 100) + floatval($store->processing_fee);
                    $transaction->update([
                        'marketplace_admin_fee' => $adminFee
                    ]);

                    $importedCount++;
                }
            });

            $message = "Berhasil mengimpor {$importedCount} pesanan Shopee.";
            if ($skippedCount > 0) {
                $message .= " {$skippedCount} pesanan dilewati karena sudah ada.";
            }
            if (!empty($errorMessages)) {
                $message .= " " . implode(' ', array_slice($errorMessages, 0, 3));
                if (count($errorMessages) > 3) {
                    $message .= " ...";
                }
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

            return back();
        } catch (\Exception $e) {
            if ($e instanceof ValidationException) {
                throw $e;
            }
            throw ValidationException::withMessages(['file' => 'Gagal membaca file Excel: ' . $e->getMessage()]);
        }
    }

    public function uploadProof(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::user()->id) {
            abort(403);
        }

        $request->validate([
            'package_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        if ($request->hasFile('package_proof')) {
            if ($transaction->package_proof) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->package_proof);
            }

            $path = $request->file('package_proof')->store('package_proofs', 'public');
            
            $transaction->update([
                'package_proof' => $path
            ]);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Bukti packing paket berhasil diunggah!'
            ]);
        }

        return back();
    }

    public function deleteProof(Transaction $transaction)
    {
        if ($transaction->user_id !== Auth::user()->id) {
            abort(403);
        }

        if ($transaction->package_proof) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->package_proof);
            
            $transaction->update([
                'package_proof' => null
            ]);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Bukti packing berhasil dihapus.'
            ]);
        }

        return back();
    }

    public function packingStation()
    {
        return redirect()->route('dashboard')->with('error', 'Stasiun Packing sekarang hanya dapat diakses melalui Aplikasi Mobile.');
    }

    public function uploadProofByBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
            'package_proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120'
        ]);

        $barcode = $request->input('barcode');

        $token = $request->bearerToken() ?? $request->header('X-Mobile-Token');
        $user = null;

        if ($token) {
            try {
                $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($token);
                $parts = explode('|', $decrypted);
                $user = \App\Models\User::find($parts[0]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sesi tidak valid, silakan login kembali.'
                ], 401);
            }
        } else {
            $user = Auth::user();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan login terlebih dahulu untuk mengakses stasiun packing.'
            ], 401);
        }

        $transaction = Transaction::where('user_id', $user->id)
            ->where(function ($query) use ($barcode) {
                $query->where('invoice_number', $barcode)
                      ->orWhere('waybill_number', $barcode);
            })
            ->with('store')
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'No. Pesanan atau Resi "' . $barcode . '" tidak ditemukan di database.'
            ], 404);
        }

        if ($request->hasFile('package_proof')) {
            if ($transaction->package_proof) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->package_proof);
            }

            $path = $request->file('package_proof')->store('package_proofs', 'public');
            
            $transaction->update([
                'package_proof' => $path
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti packing berhasil direkam!',
                'transaction' => [
                    'id' => $transaction->id,
                    'invoice_number' => $transaction->invoice_number,
                    'waybill_number' => $transaction->waybill_number,
                    'package_proof' => $path,
                    'store_name' => $transaction->store ? $transaction->store->name : 'Toko',
                    'platform' => $transaction->store ? $transaction->store->platform : 'Marketplace',
                    'updated_at' => $transaction->updated_at->toIso8601String()
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Gagal menerima file gambar.'
        ], 400);
    }

    public function searchProof(Request $request)
    {
        $query = $request->query('query');
        if (empty($query)) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan masukkan nomor resi atau pesanan.'
            ], 400);
        }

        $transaction = Transaction::where('user_id', \Illuminate\Support\Facades\Auth::user()->id)
            ->where(function ($q) use ($query) {
                $q->where('invoice_number', $query)
                  ->orWhere('waybill_number', $query);
            })
            ->with('store')
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti packing tidak ditemukan untuk nomor "' . $query . '".'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'transaction' => [
                'id' => $transaction->id,
                'invoice_number' => $transaction->invoice_number,
                'waybill_number' => $transaction->waybill_number ?? '-',
                'store_name' => $transaction->store ? $transaction->store->name : 'Toko',
                'platform' => $transaction->store ? $transaction->store->platform : 'Marketplace',
                'package_proof' => $transaction->package_proof ? asset('storage/' . $transaction->package_proof) : null,
                'transaction_date' => $transaction->transaction_date,
                'grand_total' => $transaction->grand_total,
                'status' => $transaction->status,
            ]
        ]);
    }

    public function mobileLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            
            // Secure connection token using App Key encryption (zero migration!)
            $token = \Illuminate\Support\Facades\Crypt::encryptString($user->id . '|' . time());

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Email atau password salah.'
        ], 401);
    }

    public function mobileStats(Request $request)
    {
        $token = $request->bearerToken() ?? $request->header('X-Mobile-Token');
        $user = null;

        if ($token) {
            try {
                $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($token);
                $parts = explode('|', $decrypted);
                $user = \App\Models\User::find($parts[0]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sesi tidak valid, silakan login kembali.'
                ], 401);
            }
        } else {
            $user = Auth::user();
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $pendingCount = Transaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereNull('package_proof')
            ->count();

        return response()->json([
            'success' => true,
            'pending_count' => $pendingCount,
        ]);
    }
}

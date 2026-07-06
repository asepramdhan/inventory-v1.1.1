<?php

namespace App\Http\Controllers;

use App\Models\FinancialAccount;
use App\Models\FinancialMutation;
use App\Models\ProducerInvoice;
use App\Models\ProducerInvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProducerStockController extends Controller
{
    public function index()
    {
        $userId = Auth::user()->id;

        // Ambil semua nota kiriman produsen
        $invoices = ProducerInvoice::with('items')
            ->where('user_id', $userId)
            ->orderBy('status', 'asc')
            ->orderBy('received_date', 'desc')
            ->get();

        $accounts = FinancialAccount::where('user_id', $userId)->where('is_active', true)->get();

        // HITUNGAN BARU: Hitung total sisa hutang (Total Tagihan dikurangi Yang Sudah Dibayar)
        $totalUnpaid = ProducerInvoice::where('user_id', $userId)
            ->where('status', 'unpaid')
            ->selectRaw('SUM(total_amount - paid_amount) as total_sisa')
            ->value('total_sisa') ?? 0;

        $masterProducers = \App\Models\Producer::where('user_id', $userId)->get();

        return Inertia::render('operational/producer-stocks', [
            'invoices' => $invoices,
            'accounts' => $accounts,
            'totalUnpaid' => (float)$totalUnpaid,
            'masterProducers' => $masterProducers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'producer_id' => 'required|exists:producers,id',
            'invoice_number' => 'required|string',
            'received_date' => 'required|date',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_per_item' => 'required|numeric|min:0',
        ]);

        $userId = Auth::user()->id;

        DB::transaction(function () use ($request, $userId) {
            $producerMaster = \App\Models\Producer::find($request->producer_id);

            $invoice = ProducerInvoice::create([
                'user_id' => $userId,
                'producer_id' => $request->producer_id,
                'producer_name' => $producerMaster->name,
                'invoice_number' => $request->invoice_number,
                'received_date' => $request->received_date,
                'status' => 'unpaid',
                'description' => $request->description,
                'total_amount' => 0,
                'paid_amount' => 0 // Set default cicilan ke 0
            ]);

            $totalAmount = 0;

            foreach ($request->items as $item) {
                $subtotal = $item['quantity'] * $item['cost_per_item'];
                $totalAmount += $subtotal;

                ProducerInvoiceItem::create([
                    'producer_invoice_id' => $invoice->id,
                    'item_name' => $item['item_name'],
                    'quantity' => $item['quantity'],
                    'cost_per_item' => $item['cost_per_item'],
                    'subtotal' => $subtotal
                ]);
            }

            $invoice->update(['total_amount' => $totalAmount]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pemasukan stok dari produsen berhasil dicatat sebagai hutang!']);
        return back();
    }

    // FUNGSI BARU: Generate Nomor Nota Otomatis
    public function generateInvoiceNumber()
    {
        $today = \Carbon\Carbon::now('Asia/Jakarta')->format('Ymd'); // Contoh: 20260706

        // Hitung ada berapa nota produsen yang dibuat HARI INI
        $countToday = \App\Models\ProducerInvoice::whereDate('created_at', \Carbon\Carbon::today('Asia/Jakarta'))
            ->count();

        // Nomor urut berikutnya (misal nota ke-1 hari ini -> 0001)
        $nextNumber = str_pad($countToday + 1, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'invoice_number' => "INV/{$today}/{$nextNumber}"
        ]);
    }

    // FUNGSI UNTUK BAYAR MINGGUAN
    // FUNGSI PEMBAYARAN SEBAGIAN (CICILAN)
    public function payInvoice(Request $request, $id)
    {
        $request->validate([
            'financial_account_id' => 'required|exists:financial_accounts,id',
            'paid_date' => 'required|date',
            'amount_to_pay' => 'required|numeric|min:1'
        ]);

        $userId = Auth::user()->id;
        $invoice = ProducerInvoice::where('user_id', $userId)->findOrFail($id);

        if ($invoice->status === 'paid') {
            return back()->withErrors(['message' => 'Faktur ini sudah lunas sepenuhnya!']);
        }

        // Validasi Sisa Tagihan
        $sisaTagihan = $invoice->total_amount - $invoice->paid_amount;
        if ($request->amount_to_pay > $sisaTagihan) {
            return back()->withErrors(['amount_to_pay' => 'Nominal bayar tidak boleh melebihi sisa tagihan!']);
        }

        $account = FinancialAccount::where('user_id', $userId)->findOrFail($request->financial_account_id);
        if ($account->current_balance < $request->amount_to_pay) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Saldo di ' . $account->name . ' tidak cukup!']);
            return back();
        }

        DB::transaction(function () use ($invoice, $account, $request, $userId, $sisaTagihan) {
            // 1. Potong Saldo Rekening
            $account->current_balance -= $request->amount_to_pay;
            $account->save();

            // 2. Buat Catatan Mutasi Kas Keluar
            $keteranganCicilan = ($request->amount_to_pay < $sisaTagihan) ? ' (Pembayaran Sebagian)' : ' (Pelunasan Akhir)';
            FinancialMutation::create([
                'user_id' => $userId,
                'financial_account_id' => $account->id,
                'date' => $request->paid_date,
                'type' => 'expense',
                'category' => 'Pelunasan Produsen',
                'amount' => $request->amount_to_pay,
                'balance_snapshot' => $account->current_balance,
                'reference_number' => $invoice->invoice_number,
                'description' => 'Pembayaran tagihan stok kepada ' . $invoice->producer_name . $keteranganCicilan
            ]);

            // 3. Update Nota (Tambah angka terbayar, lalu cek apakah sudah lunas)
            $totalTerbayarBaru = $invoice->paid_amount + $request->amount_to_pay;
            $statusBaru = ($totalTerbayarBaru >= $invoice->total_amount) ? 'paid' : 'unpaid';

            $invoice->update([
                'paid_amount' => $totalTerbayarBaru,
                'status' => $statusBaru,
                'paid_date' => $request->paid_date,
                'financial_account_id' => $request->financial_account_id
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran berhasil diproses dan kas telah dipotong!']);
        return back();
    }
}

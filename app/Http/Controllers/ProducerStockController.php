<?php

namespace App\Http\Controllers;

use App\Models\FinancialAccount;
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
            ->orderBy('status', 'asc') // Tampilkan yang belum lunas di atas
            ->orderBy('received_date', 'desc')
            ->get();

        // Ambil list kas untuk pilihan pembayaran nanti
        $accounts = FinancialAccount::where('user_id', $userId)->where('is_active', true)->get();

        // Hitung total hutang yang belum dibayar ke produsen
        $totalUnpaid = ProducerInvoice::where('user_id', $userId)->where('status', 'unpaid')->sum('total_amount');

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
            // 1. Buat Header Faktur
            $invoice = ProducerInvoice::create([
                'user_id' => $userId,
                'producer_id' => $request->producer_id,
                'producer_name' => $producerMaster->name,
                'invoice_number' => $request->invoice_number,
                'received_date' => $request->received_date,
                'status' => 'unpaid', // Default belum dibayar
                'description' => $request->description,
                'total_amount' => 0 // Akan dihitung dari item
            ]);

            $totalAmount = 0;

            // 2. Masukkan list barang
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

            // 3. Update total tagihan asli nota ini
            $invoice->update(['total_amount' => $totalAmount]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pemasukan stok dari produsen berhasil dicatat sebagai hutang!']);
        return back();
    }

    // FUNGSI UNTUK BAYAR MINGGUAN
    public function payInvoice(Request $request, $id)
    {
        $request->validate([
            'financial_account_id' => 'required|exists:financial_accounts,id',
            'paid_date' => 'required|date'
        ]);

        $userId = Auth::user()->id;
        $invoice = ProducerInvoice::where('user_id', $userId)->findOrFail($id);

        if ($invoice->status === 'paid') {
            return back()->withErrors(['message' => 'Faktur ini sudah lunas!']);
        }

        // Cek kecukupan saldo kas pilihan
        $account = FinancialAccount::where('user_id', $userId)->findOrFail($request->financial_account_id);
        if ($account->current_balance < $invoice->total_amount) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Saldo di ' . $account->name . ' tidak cukup untuk melunasi nota ini!']);
            return back();
        }

        // Trigger update untuk jalankan otomatisasi booted() di model
        $invoice->update([
            'status' => 'paid',
            'paid_date' => $request->paid_date,
            'financial_account_id' => $request->financial_account_id
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nota produsen berhasil dilunasi dan mutasi kas terpotong!']);
        return back();
    }
}

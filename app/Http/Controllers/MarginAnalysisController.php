<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MarginAnalysisController extends Controller
{
    public function index(Request $request)
    {
        // 0. Ambil ID Toko-Toko yang Hanya Miliki User Login
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        // 1. Tentukan Default Filter
        $timezone = 'Asia/Jakarta';
        $startDate = $request->input('start_date', Carbon::now($timezone)->subDays(30)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now($timezone)->format('Y-m-d'));
        $storeId = $request->input('store_id', 'all');

        // Memastikan format datetime penuh untuk query SQL between
        $fullStartDate = $startDate . ' 00:00:00';
        $fullEndDate = $endDate . ' 23:59:59';

        // 2. Buat Subquery untuk Menghitung Total HPP per Transaksi
        $subQueryHpp = DB::table('transaction_items')
            ->select('transaction_id', DB::raw('SUM(total_hpp_snapshot * quantity) as total_transaction_hpp'))
            ->groupBy('transaction_id');

        // 3. Kueri Dasar (Base Query)
        $baseQuery = Transaction::query()
            ->leftJoinSub($subQueryHpp, 'items_hpp', function ($join) {
                $join->on('transactions.id', '=', 'items_hpp.transaction_id');
            })
            ->whereBetween('transaction_date', [$fullStartDate, $fullEndDate])
            ->where('status', '!=', 'cancelled')
            ->whereIn('store_id', $userStoreIds)
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId, $userStoreIds) {
                if (in_array($storeId, $userStoreIds)) {
                    return $q->where('store_id', $storeId);
                }
                return $q;
            });

        // ==========================================
        // DATA 1: RINGKASAN UTAMA (SUMMARY CARDS)
        // ==========================================
        // KUERI A: Tetap Asli (Menghitung akumulasi dasar tanpa filter status agar card lain aman)
        $summaryRaw = (clone $baseQuery)
            ->selectRaw('
                COALESCE(SUM(grand_total), 0) as total_omzet,
                COALESCE(SUM(marketplace_admin_fee), 0) as total_admin_fee,
                COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as total_hpp
            ')
            ->first();

        $totalOmzet = (float) $summaryRaw->total_omzet;
        $totalAdminFee = (float) $summaryRaw->total_admin_fee;
        $totalHpp = (float) $summaryRaw->total_hpp;

        // Ini adalah total profit kotor gabungan semua status aktif
        $totalNetProfitAbsolut = $totalOmzet - $totalAdminFee - $totalHpp;

        // KUERI B: DISESUAIKAN DENGAN STATUS DATABASE KAMU
        // - pending / menunggu -> masuk ke kantong "Diproses"
        // - processing / dikirim -> masuk ke kantong "Dikirim"
        $ongoingRaw = (clone $baseQuery)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status IN ('pending', 'menunggu') THEN (grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_pending,
                COALESCE(SUM(CASE WHEN status IN ('processing', 'dikirim') THEN (grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_processing
            ")
            ->first();

        $profitPending = (float) $ongoingRaw->profit_pending;
        $profitProcessing = (float) $ongoingRaw->profit_processing;

        // UANG RIIL (Selesai) = Total Profit dikurangi nominal pending & processing
        $realNetProfit = $totalNetProfitAbsolut - $profitPending - $profitProcessing;
        $averageMargin = $totalOmzet > 0 ? round(($realNetProfit / $totalOmzet) * 100, 2) : 0;

        $summary = [
            'total_omzet' => $totalOmzet,
            'total_admin_fee' => $totalAdminFee,
            'total_hpp' => $totalHpp,
            'net_profit' => $realNetProfit,
            'average_margin_percentage' => $averageMargin,
            'profit_pending' => $profitPending, // Ini isinya data 'pending'
            'profit_processing' => $profitProcessing,       // Ini isinya data 'processing'
        ];

        // ==========================================
        // DATA 2: TREN HARIAN (UNTUK LINE CHART)
        // ==========================================
        $trendData = (clone $baseQuery)
            ->selectRaw('
                DATE_FORMAT(transaction_date, "%Y-%m-%d") as date,
                COALESCE(SUM(grand_total), 0) as omzet,
                COALESCE(SUM(marketplace_admin_fee), 0) as admin_fee,
                COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as hpp
            ')
            ->groupBy(DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d")'))
            ->orderBy(DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d")'), 'ASC')
            ->get()
            ->map(function ($item) {
                $omzet = (float) $item->omzet;
                $admin = (float) $item->admin_fee;
                $hpp = (float) $item->hpp;
                return [
                    'date' => $item->date,
                    'omzet' => $omzet,
                    'net_profit' => $omzet - $admin - $hpp
                ];
            });

        // ==========================================
        // DATA 3: PERFORMA PER TOKO (UNTUK BAR CHART)
        // ==========================================
        $storePerformance = Transaction::query()
            ->leftJoinSub($subQueryHpp, 'items_hpp', function ($join) {
                $join->on('transactions.id', '=', 'items_hpp.transaction_id');
            })
            ->join('stores', 'transactions.store_id', '=', 'stores.id')
            ->whereBetween('transaction_date', [$fullStartDate, $fullEndDate])
            ->where('status', '!=', 'cancelled')
            ->whereIn('transactions.store_id', $userStoreIds)
            ->groupBy('transactions.store_id', 'stores.name', 'stores.platform')
            ->selectRaw('
                stores.name as store_name,
                stores.platform,
                COALESCE(SUM(grand_total), 0) as omzet,
                COALESCE(SUM(marketplace_admin_fee), 0) as admin_fee,
                COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as hpp
            ')
            ->get()
            ->map(function ($item) {
                $omzet = (float) $item->omzet;
                $admin = (float) $item->admin_fee;
                $hpp = (float) $item->hpp;
                $profit = $omzet - $admin - $hpp;
                return [
                    'store_name' => $item->store_name,
                    'platform' => $item->platform,
                    'omzet' => $omzet,
                    'net_profit' => $profit,
                    'margin_percentage' => $omzet > 0 ? round(($profit / $omzet) * 100, 2) : 0
                ];
            });

        // ==========================================
        // DATA 4: RANKING PRODUK
        // ==========================================
        $productPerformance = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereBetween('transactions.transaction_date', [$fullStartDate, $fullEndDate])
            ->where('transactions.status', '!=', 'cancelled')
            ->whereIn('transactions.store_id', $userStoreIds)
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId, $userStoreIds) {
                if (in_array($storeId, $userStoreIds)) {
                    return $q->where('transactions.store_id', $storeId);
                }
                return $q;
            })
            ->groupBy('transaction_items.product_id', 'transaction_items.product_name', 'transaction_items.product_sku')
            ->selectRaw('
                transaction_items.product_name,
                transaction_items.product_sku,
                SUM(transaction_items.quantity) as total_qty,
                SUM(transaction_items.selling_price * transaction_items.quantity) as gross_sales,
                SUM(transaction_items.total_hpp_snapshot * transaction_items.quantity) as total_hpp
            ')
            ->orderBy(DB::raw('gross_sales - total_hpp'), 'DESC')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $sales = (float) $item->gross_sales;
                $hpp = (float) $item->total_hpp;
                return [
                    'product_name' => $item->product_name,
                    'product_sku' => $item->product_sku,
                    'total_qty' => (int) $item->total_qty,
                    'gross_sales' => $sales,
                    'gross_profit' => $sales - $hpp,
                    'margin_percentage' => $sales > 0 ? round((($sales - $hpp) / $sales) * 100, 2) : 0
                ];
            });

        // 4. Kirim Data Lengkap ke Frontend React via Inertia
        return Inertia::render('finance/margin-analysis', [
            'summary' => $summary,
            'trendData' => $trendData,
            'storePerformance' => $storePerformance,
            'productPerformance' => $productPerformance,
            'storesList' => Store::where('user_id', $userId)->select('id', 'name', 'platform')->get(),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'store_id' => $storeId,
            ]
        ]);
    }
}

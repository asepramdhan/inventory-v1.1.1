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

        // Tentukan list toko yang sedang aktif difilter saat ini
        $activeStoreIds = ($storeId === 'all') ? $userStoreIds : [$storeId];

        // ==========================================
        // DATA 1: RINGKASAN UTAMA (SUMMARY CARDS)
        // ==========================================
        // Ambil akumulasi transaksi dari tabel transactions
        $summaryRaw = (clone $baseQuery)
            ->selectRaw('
        COALESCE(SUM(grand_total), 0) as total_omzet,
        COALESCE(SUM(marketplace_admin_fee), 0) as total_admin_fee,
        COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as total_hpp,
        COALESCE(SUM(affiliate_fee), 0) as total_affiliate_fee
    ')
            ->first();

        $totalOmzet = (float) $summaryRaw->total_omzet;
        $totalAdminFee = (float) $summaryRaw->total_admin_fee;
        $totalHpp = (float) $summaryRaw->total_hpp;
        $totalAffiliateFee = (float) $summaryRaw->total_affiliate_fee;

        // AMBIL TOTAL BIAYA IKLAN DARI TABEL SEPARATE 'store_daily_ads'
        $totalAdsFee = (float) DB::table('store_daily_ads')
            ->whereIn('store_id', $activeStoreIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('amount_spent');

        // Rumus Profit Bersih: Omzet dikurangi semua komponen pengeluaran & iklan
        $totalNetProfitAbsolut = $totalOmzet - $totalAdminFee - $totalHpp - $totalAffiliateFee - $totalAdsFee;

        // Hitung profit berjalan (dana tertahan) tanpa memotong iklan harian di dalamnya
        $ongoingRaw = (clone $baseQuery)
            ->selectRaw("
        COALESCE(SUM(CASE WHEN status IN ('pending', 'menunggu') THEN (grand_total - marketplace_admin_fee - COALESCE(affiliate_fee, 0) - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_pending,
        COALESCE(SUM(CASE WHEN status IN ('processing', 'dikirim') THEN (grand_total - marketplace_admin_fee - COALESCE(affiliate_fee, 0) - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_processing
    ")
            ->first();

        $profitPending = (float) $ongoingRaw->profit_pending;
        $profitProcessing = (float) $ongoingRaw->profit_processing;

        $realNetProfit = $totalNetProfitAbsolut - $profitPending - $profitProcessing;
        $averageMargin = $totalOmzet > 0 ? round(($realNetProfit / $totalOmzet) * 100, 2) : 0;

        $summary = [
            'total_omzet' => $totalOmzet,
            'total_admin_fee' => $totalAdminFee,
            'total_hpp' => $totalHpp,
            'total_affiliate_fee' => $totalAffiliateFee,
            'total_ads_fee' => $totalAdsFee, // Data iklan terkirim aman ke frontend!
            'net_profit' => $realNetProfit,
            'average_margin_percentage' => $averageMargin,
            'profit_pending' => $profitPending,
            'profit_processing' => $profitProcessing,
        ];

        // ==========================================
        // DATA 2: TREN HARIAN (UNTUK LINE CHART)
        // ==========================================
        // 1. Ambil transaksi harian
        $trendDataRaw = (clone $baseQuery)
            ->selectRaw('
        DATE_FORMAT(transaction_date, "%Y-%m-%d") as date,
        COALESCE(SUM(grand_total), 0) as omzet,
        COALESCE(SUM(marketplace_admin_fee), 0) as admin_fee,
        COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as hpp,
        COALESCE(SUM(affiliate_fee), 0) as affiliate_fee
    ')
            ->groupBy(DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d")'))
            ->orderBy(DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d")'), 'ASC')
            ->get();

        // 2. Ambil data iklan harian gembok berdasarkan tanggal
        $dailyAdsMap = DB::table('store_daily_ads')
            ->whereIn('store_id', $activeStoreIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('date')
            ->selectRaw('date, SUM(amount_spent) as total_ads')
            ->pluck('total_ads', 'date')
            ->toArray(); // Menghasilkan array ['2026-06-01' => 50000, ...]

        // 3. Gabungkan data Transaksi & Iklan menggunakan PHP Map
        $trendData = $trendDataRaw->map(function ($item) use ($dailyAdsMap) {
            $date = $item->date;
            $omzet = (float) $item->omzet;
            $adsFee = (float) ($dailyAdsMap[$date] ?? 0); // Ambil jika ada, jika tidak ada = 0

            return [
                'date' => $date,
                'omzet' => $omzet,
                'net_profit' => $omzet - (float)$item->admin_fee - (float)$item->hpp - (float)$item->affiliate_fee - $adsFee
            ];
        });

        // ==========================================
        // DATA 3: PERFORMA PER TOKO (UNTUK BAR CHART)
        // ==========================================
        // 1. Ambil performa penjualan toko
        $storePerformanceRaw = Transaction::query()
            ->leftJoinSub($subQueryHpp, 'items_hpp', function ($join) {
                $join->on('transactions.id', '=', 'items_hpp.transaction_id');
            })
            ->join('stores', 'transactions.store_id', '=', 'stores.id')
            ->whereBetween('transaction_date', [$fullStartDate, $fullEndDate])
            ->where('status', '!=', 'cancelled')
            ->whereIn('transactions.store_id', $activeStoreIds)
            ->groupBy('transactions.store_id', 'stores.name', 'stores.platform')
            ->selectRaw('
        transactions.store_id,
        stores.name as store_name,
        stores.platform,
        COALESCE(SUM(grand_total), 0) as omzet,
        COALESCE(SUM(marketplace_admin_fee), 0) as admin_fee,
        COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as hpp,
        COALESCE(SUM(affiliate_fee), 0) as affiliate_fee
    ')
            ->get();

        // 2. Ambil total pengeluaran iklan per toko
        $storeAdsMap = DB::table('store_daily_ads')
            ->whereIn('store_id', $activeStoreIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('store_id')
            ->selectRaw('store_id, SUM(amount_spent) as total_ads')
            ->pluck('total_ads', 'store_id')
            ->toArray(); // Menghasilkan array [store_id => total_pengeluaran_iklan]

        // 3. Satukan data performa toko dengan pengeluaran iklan masing-masing
        $storePerformance = $storePerformanceRaw->map(function ($item) use ($storeAdsMap) {
            $storeId = $item->store_id;
            $omzet = (float) $item->omzet;
            $adsFee = (float) ($storeAdsMap[$storeId] ?? 0);

            $profit = $omzet - (float)$item->admin_fee - (float)$item->hpp - (float)$item->affiliate_fee - $adsFee;

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

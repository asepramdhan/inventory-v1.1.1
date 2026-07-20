<?php

namespace App\Http\Controllers;

use App\Models\FinancialAccount;
use App\Models\FinancialMutation;
use App\Models\ProducerInvoice;
use App\Models\Product;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::user()->id;

        // 1. HITUNG 4 WIDGET SUMMARY CARD
        $totalKas = FinancialAccount::where('user_id', $userId)->sum('current_balance');

        $totalHutang = ProducerInvoice::where('user_id', $userId)
            ->where('status', 'unpaid')
            ->selectRaw('SUM(total_amount - paid_amount) as sisa')->value('sisa') ?? 0;

        // =========================================================================
        // SINKRONISASI LOGIKA DENGAN ANALISA MARGIN (PROFIT & OMZET BULAN INI)
        // =========================================================================
        $timezone = 'Asia/Jakarta';
        $startOfMonth = Carbon::now($timezone)->startOfMonth()->format('Y-m-d 00:00:00');
        $endOfMonth = Carbon::now($timezone)->endOfMonth()->format('Y-m-d 23:59:59');
        $startDateDateOnly = Carbon::now($timezone)->startOfMonth()->format('Y-m-d');
        $endDateDateOnly = Carbon::now($timezone)->endOfMonth()->format('Y-m-d');

        $userStoreIds = \App\Models\Store::where('user_id', $userId)->pluck('id')->toArray();

        // A. Subquery HPP
        $subQueryHpp = DB::table('transaction_items')
            ->select('transaction_id', DB::raw('SUM(total_hpp_snapshot * quantity) as total_transaction_hpp'))
            ->groupBy('transaction_id');

        // B. Base Query Transaksi
        $baseQuery = Transaction::query()
            ->leftJoinSub($subQueryHpp, 'items_hpp', function ($join) {
                $join->on('transactions.id', '=', 'items_hpp.transaction_id');
            })
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->where('status', '!=', 'cancelled')
            ->whereIn('store_id', $userStoreIds);

        // C. Omzet, Admin, HPP (Termasuk Pending & Processing)
        $summaryRaw = (clone $baseQuery)->selectRaw('
            COALESCE(SUM(grand_total), 0) as total_omzet,
            COALESCE(SUM(marketplace_admin_fee), 0) as total_admin_fee,
            COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as total_hpp
        ')->first();

        $omzetBulanIni = (float) $summaryRaw->total_omzet;

        // D. Ads & Affiliate (Dari tabel store_daily_ads)
        $adsData = DB::table('store_daily_ads')
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startDateDateOnly, $endDateDateOnly])
            ->selectRaw('COALESCE(SUM(amount_spent), 0) as total_ads, COALESCE(SUM(affiliate_fee), 0) as total_affiliate')
            ->first();

        // E. Profit Kotor Absolut (Omzet - Admin - HPP - Iklan - Affliate)
        $totalNetProfitAbsolut = $omzetBulanIni
            - (float)$summaryRaw->total_admin_fee
            - (float)$summaryRaw->total_hpp
            - (float)$adsData->total_affiliate
            - (float)$adsData->total_ads;

        // F. Hitung Laba Ditahan (Pending/Processing)
        $ongoingRaw = (clone $baseQuery)->selectRaw("
            COALESCE(SUM(CASE WHEN status IN ('pending', 'menunggu', 'packed') THEN (grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_pending,
            COALESCE(SUM(CASE WHEN status IN ('processing', 'dikirim') THEN (grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_processing
        ")->first();

        // G. Profit Bersih Riil (Sesuai Margin Analysis)
        $profitBulanIni = $totalNetProfitAbsolut - (float)$ongoingRaw->profit_pending - (float)$ongoingRaw->profit_processing;
        $profitPending = (float) $ongoingRaw->profit_pending;
        $profitProcessing = (float) $ongoingRaw->profit_processing;

        // H. Hitung Profit Batal / Cancel
        $profitCancelled = (float) Transaction::query()
            ->leftJoinSub($subQueryHpp, 'items_hpp', function ($join) {
                $join->on('transactions.id', '=', 'items_hpp.transaction_id');
            })
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->where('status', 'cancelled')
            ->whereIn('store_id', $userStoreIds)
            ->selectRaw('COALESCE(SUM(grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)), 0) as total')
            ->value('total') ?? 0;
        // =========================================================================

        // 2. AMBIL DATA PERINGATAN STOK TIPIS (Stok di bawah 5)
        $stokTipis = Product::where('user_id', $userId)
            ->where('stock', '<=', 5)
            ->orderBy('stock', 'asc')
            ->limit(5)
            ->get(['id', 'name', 'stock', 'image']);

        // 3. AMBIL 5 TABEL DATA TERBARU
        $transaksiTerbaru = Transaction::with('store')
            ->where('user_id', $userId)
            ->latest('transaction_date')
            ->limit(5)
            ->get();

        $mutasiTerbaru = FinancialMutation::with('account')
            ->where('user_id', $userId)
            ->latest('created_at')
            ->limit(5)
            ->get();

        // 4. DATA GRAFIK 7 HARI TERAKHIR (RIIL)
        $startChartDate = Carbon::now($timezone)->subDays(6)->format('Y-m-d');
        $endChartDate = Carbon::now($timezone)->format('Y-m-d');
        $startChartFull = $startChartDate . ' 00:00:00';
        $endChartFull = $endChartDate . ' 23:59:59';

        $chartRaw = Transaction::query()
            ->leftJoinSub($subQueryHpp, 'items_hpp', function ($join) {
                $join->on('transactions.id', '=', 'items_hpp.transaction_id');
            })
            ->whereBetween('transaction_date', [$startChartFull, $endChartFull])
            ->where('status', '!=', 'cancelled')
            ->whereIn('store_id', $userStoreIds)
            ->selectRaw('
                DATE_FORMAT(transaction_date, "%Y-%m-%d") as date,
                COALESCE(SUM(grand_total), 0) as omzet,
                COALESCE(SUM(marketplace_admin_fee), 0) as admin_fee,
                COALESCE(SUM(items_hpp.total_transaction_hpp), 0) as hpp
            ')
            ->groupBy(DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d")'))
            ->orderBy(DB::raw('DATE_FORMAT(transaction_date, "%Y-%m-%d")'), 'ASC')
            ->get()
            ->keyBy('date');

        $dailyAdsMap = DB::table('store_daily_ads')
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startChartDate, $endChartDate])
            ->groupBy('date')
            ->selectRaw('date, SUM(amount_spent) as total_ads, SUM(affiliate_fee) as total_affiliate')
            ->get()
            ->keyBy('date');

        $chartData = collect(range(6, 0))->map(function ($daysAgo) use ($timezone, $chartRaw, $dailyAdsMap) {
            $date = Carbon::now($timezone)->subDays($daysAgo)->format('Y-m-d');
            $row = $chartRaw->get($date);
            $omzet = (float) ($row->omzet ?? 0);
            $admin = (float) ($row->admin_fee ?? 0);
            $hpp = (float) ($row->hpp ?? 0);
            $ads = (float) ($dailyAdsMap[$date]->total_ads ?? 0);
            $affiliate = (float) ($dailyAdsMap[$date]->total_affiliate ?? 0);

            return [
                'date' => $date,
                'omzet' => $omzet,
                'profit' => $omzet - $admin - $hpp - $ads - $affiliate,
            ];
        })->values()->all();

        return Inertia::render('dashboard', [
            'summary' => [
                'kas' => (float)$totalKas,
                'hutang' => (float)$totalHutang,
                'omzet' => (float)$omzetBulanIni,
                'profit' => (float)$profitBulanIni,
                'profit_pending' => $profitPending,
                'profit_processing' => $profitProcessing,
                'profit_cancelled' => $profitCancelled,
            ],
            'stokTipis' => $stokTipis,
            'transaksiTerbaru' => $transaksiTerbaru,
            'mutasiTerbaru' => $mutasiTerbaru,
            'chartData' => $chartData,
        ]);
    }
}

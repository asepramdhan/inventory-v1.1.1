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
            COALESCE(SUM(CASE WHEN status IN ('pending', 'menunggu') THEN (grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_pending,
            COALESCE(SUM(CASE WHEN status IN ('processing', 'dikirim') THEN (grand_total - marketplace_admin_fee - COALESCE(items_hpp.total_transaction_hpp, 0)) ELSE 0 END), 0) as profit_processing
        ")->first();

        // G. Profit Bersih Riil (Sesuai Margin Analysis)
        $profitBulanIni = $totalNetProfitAbsolut - (float)$ongoingRaw->profit_pending - (float)$ongoingRaw->profit_processing;
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
            ->latest('date')
            ->limit(5)
            ->get();

        // 4. DATA GRAFIK (Mockup data 7 hari terakhir, bisa Anda kembangkan)
        $chartData = [
            ['date' => '10 Jul', 'omzet' => 1200000, 'profit' => 300000],
            ['date' => '11 Jul', 'omzet' => 1500000, 'profit' => 450000],
            ['date' => '12 Jul', 'omzet' => 800000, 'profit' => 200000],
            ['date' => '13 Jul', 'omzet' => 2100000, 'profit' => 700000],
            ['date' => '14 Jul', 'omzet' => 1800000, 'profit' => 500000],
        ];

        return Inertia::render('dashboard', [
            'summary' => [
                'kas' => (float)$totalKas,
                'hutang' => (float)$totalHutang,
                'omzet' => (float)$omzetBulanIni,
                'profit' => (float)$profitBulanIni,
            ],
            'stokTipis' => $stokTipis,
            'transaksiTerbaru' => $transaksiTerbaru,
            'mutasiTerbaru' => $mutasiTerbaru,
            'chartData' => $chartData,
        ]);
    }
}

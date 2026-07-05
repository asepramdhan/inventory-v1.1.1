<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreDailyAds;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdsAffiliateController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        // 1. Filter Tanggal, Toko & Pencarian Search
        $timezone = 'Asia/Jakarta';
        $startDate = $request->input('start_date', Carbon::now($timezone)->subDays(30)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now($timezone)->format('Y-m-d'));
        $storeId = $request->input('store_id', 'all');
        $search = $request->input('search');

        $fullStartDate = $startDate . ' 00:00:00';
        $fullEndDate = $endDate . ' 23:59:59';

        // ==========================================
        // DATA 1: AKUMULASI METRIK UTAMA (CARD)
        // ==========================================

        // A. Ambil total omzet dan total affiliate RIIL TRANSAKSI dari tabel transaksi (Exclude Cancelled)
        $transactionSummary = Transaction::query()
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('transaction_date', [$fullStartDate, $fullEndDate])
            ->where('status', '!=', 'cancelled')
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId) {
                return $q->where('store_id', $storeId);
            })
            ->selectRaw('
                COALESCE(SUM(grand_total), 0) as total_omzet,
                COALESCE(SUM(affiliate_fee), 0) as total_affiliate_order
            ')
            ->first();

        $totalOmzet = (float) $transactionSummary->total_omzet;
        $totalAffiliateTransactions = (float) $transactionSummary->total_affiliate_order;

        // B. Ambil total biaya iklan DAN affiliate HARIAN MANUAL dari tabel store_daily_ads
        $adsSummaryQuery = StoreDailyAds::query()
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId) {
                return $q->where('store_id', $storeId);
            });

        $totalAds = (float) $adsSummaryQuery->sum('amount_spent');
        $totalAffiliateManual = (float) $adsSummaryQuery->sum('affiliate_fee'); // <-- Ambil data manual harian

        // Total Marketing Cost = Total Iklan + Affiliate Manual + Affiliate Riil Transaksi
        $totalMarketingCost = $totalAds + $totalAffiliateManual + $totalAffiliateTransactions;
        $marketingToOmzetRatio = $totalOmzet > 0 ? round(($totalMarketingCost / $totalOmzet) * 100, 2) : 0;

        $summary = [
            'total_omzet' => $totalOmzet,
            'total_ads' => $totalAds,
            'total_affiliate' => $totalAffiliateManual, // Dipakai Card 3 (Harian Manual)
            'total_affiliate_transactions' => $totalAffiliateTransactions, // Dipakai Card 4 (Riil Order)
            'total_marketing_cost' => $totalMarketingCost,
            'marketing_ratio_percentage' => $marketingToOmzetRatio,
        ];

        // ==========================================
        // DATA 2: PERFORMA PER TOKO
        // ==========================================
        $storesData = Store::where('user_id', $userId)->get();

        $storePerformance = $storesData->map(function ($store) use ($startDate, $endDate, $fullStartDate, $fullEndDate) {
            $omzetAff = Transaction::query()
                ->where('store_id', $store->id)
                ->whereBetween('transaction_date', [$fullStartDate, $fullEndDate])
                ->where('status', '!=', 'cancelled')
                ->selectRaw('COALESCE(SUM(grand_total), 0) as omzet, COALESCE(SUM(affiliate_fee), 0) as affiliate_order')
                ->first();

            // Ambil dari store_daily_ads untuk iklan dan affiliate manual harian
            $dailyAdsData = StoreDailyAds::where('store_id', $store->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->selectRaw('COALESCE(SUM(amount_spent), 0) as ads, COALESCE(SUM(affiliate_fee), 0) as affiliate_manual')
                ->first();

            $tOmzet = (float) $omzetAff->omzet;
            $tAds = (float) ($dailyAdsData->ads ?? 0);
            $tAffManual = (float) ($dailyAdsData->affiliate_manual ?? 0);
            $tAffOrder = (float) $omzetAff->affiliate_order;

            // Total marketing per toko menggabungkan seluruh beban pengeluaran pemasaran
            $tMarketing = $tAds + $tAffManual + $tAffOrder;

            return [
                'store_name' => $store->name,
                'platform' => $store->platform,
                'omzet' => $tOmzet,
                'ads_spent' => $tAds,
                'affiliate_fee' => $tAffManual, // Tampilkan data input harian di tabel breakdown
                'total_marketing' => $tMarketing,
                'ratio' => $tOmzet > 0 ? round(($tMarketing / $tOmzet) * 100, 2) : 0
            ];
        });

        // ==========================================
        // DATA 3: LIST LOG UTAMA UNTUK DATA TABLE (PAGINATED)
        // ==========================================
        $adsExpenses = StoreDailyAds::query()
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId) {
                return $q->where('store_id', $storeId);
            })
            ->when($search, function ($q) use ($search) {
                return $q->where(function ($sub) use ($search) {
                    $sub->where('description', 'like', "%{$search}%")
                        ->orWhere('amount_spent', 'like', "%{$search}%")
                        ->orWhereHas('store', function ($storeQ) use ($search) {
                            $storeQ->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->with('store')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('finance/ads-affiliate', [
            'summary' => $summary,
            'storePerformance' => $storePerformance,
            'adsExpenses' => $adsExpenses,
            'storesList' => $storesData->map->only(['id', 'name', 'platform']),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'store_id' => $storeId,
                'search' => $search,
            ]
        ]);
    }

    /**
     * Simpan atau Update Iklan Harian Toko
     */
    public function store(Request $request)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        $validated = $request->validate([
            'store_id' => 'required|in:' . implode(',', $userStoreIds),
            'date' => 'required|date',
            'amount_spent' => 'required|numeric|min:0',
            'affiliate_fee' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // PERBAIKAN: Cari data iklan berdasarkan toko dan tanggal secara manual
        $dailyAd = StoreDailyAds::where('store_id', $validated['store_id'])
            ->where('date', $validated['date'])
            ->first();

        if (!$dailyAd) {
            // Jika belum ada, buat objek baru
            $dailyAd = new StoreDailyAds();
            $dailyAd->store_id = $validated['store_id'];
            $dailyAd->date = $validated['date'];
        }

        // Masukkan data baru / perubahan datanya
        // Kita tambahkan user_id milik toko agar model tahu kas siapa yang harus dipotong
        // $dailyAd->user_id = $userId;
        $dailyAd->amount_spent = $validated['amount_spent'];
        $dailyAd->affiliate_fee = $validated['affiliate_fee'] ?? 0;
        $dailyAd->description = $validated['description'] ?? null;

        // Gunakan ->save() murni agar Event Model booted() di bawah terpicu 100% lancar!
        $dailyAd->save();

        // StoreDailyAds::updateOrCreate(
        //     [
        //         'store_id' => $validated['store_id'],
        //         'date' => $validated['date'],
        //     ],
        //     [
        //         'amount_spent' => $validated['amount_spent'],
        //         'affiliate_fee' => $validated['affiliate_fee'] ?? 0,
        //         'description' => $validated['description'] ?? null,
        //     ]
        // );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Biaya iklan & affiliate berhasil diperbarui!']);
        // Inertia::flash('toast', ['type' => 'success', 'message' => 'Biaya iklan berhasil diperbarui!']);

        return back();
    }

    /**
     * Update log pengeluaran iklan terpilih
     */
    public function update(Request $request, $id)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        // 1. Amankan objek berdasarkan kepemilikan toko user yang login
        $expense = StoreDailyAds::whereIn('store_id', $userStoreIds)->findOrFail($id);

        $validated = $request->validate([
            'store_id' => 'required|in:' . implode(',', $userStoreIds),
            'amount_spent' => 'required|numeric|min:0',
            'affiliate_fee' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'nullable|date', // Tambahkan ini sebagai opsional pencegah bug state date kosong
        ]);

        // 2. Lakukan update data
        $expense->store_id = $validated['store_id'];
        $expense->amount_spent = $validated['amount_spent'];
        $expense->affiliate_fee = $validated['affiliate_fee'] ?? 0;
        $expense->description = $validated['description'] ?? null;

        // Jika di request ada tanggal baru, ikut update. Jika tidak, pertahankan tanggal lama.
        if (!empty($validated['date'])) {
            $expense->date = $validated['date'];
        }

        // 3. Simpan dengan ->save() untuk memastikan sinkronisasi state model berjalan mutlak
        $expense->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Log pengeluaran berhasil diperbarui!']);

        return back();
    }

    /**
     * Hapus single data log iklan
     */
    public function destroy($id)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        $expense = StoreDailyAds::whereIn('store_id', $userStoreIds)->findOrFail($id);
        $expense->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data biaya iklan berhasil dihapus!']);

        return back();
    }

    /**
     * Aksi Massal: Hapus log terpilih dari Floating Action Bar
     */
    public function bulkDelete(Request $request)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'numeric'
        ]);

        // 1. Ambil data modelnya terlebih dahulu sebagai Collection (Gunakan get(), jangan langsung delete())
        $expenses = StoreDailyAds::whereIn('store_id', $userStoreIds)
            ->whereIn('id', $validated['ids'])
            ->get();

        // Jika tidak ada data yang cocok, langsung kembalikan
        if ($expenses->isEmpty()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Tidak ada data valid yang ditemukan untuk dihapus.']);
            return back();
        }

        // 2. Looping dan hapus per objek model agar Event booted() static::deleted terpancing!
        foreach ($expenses as $expense) {
            $expense->delete();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Semua log terpilih berhasil dihapus massal dan saldo kas disesuaikan!']);

        return back();
    }

    /**
     * Aksi Massal: Export data ke CSV/Excel format
     */
    public function export(Request $request)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        $ids = $request->input('ids');
        $query = StoreDailyAds::whereIn('store_id', $userStoreIds)->with('store');

        if ($ids) {
            $idArray = explode(',', $ids);
            $query->whereIn('id', $idArray);
        }

        $expenses = $query->orderBy('date', 'desc')->get();
        $filename = "export_biaya_iklan_" . date('Ymd_His') . ".csv";

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function () use ($expenses) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID Log', 'Tanggal Catat', 'Nama Toko', 'Platform', 'Nominal Iklan (Rp)', 'Catatan']);

            foreach ($expenses as $row) {
                fputcsv($file, [
                    $row->id,
                    $row->date,
                    $row->store?->name ?? 'Toko Terhapus',
                    $row->store?->platform ?? '-',
                    $row->amount_spent,
                    $row->description ?? '-'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

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

        // A. Ambil total omzet dan total affiliate dari tabel transaksi (Exclude Cancelled)
        $transactionSummary = Transaction::query()
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('transaction_date', [$fullStartDate, $fullEndDate])
            ->where('status', '!=', 'cancelled')
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId) {
                return $q->where('store_id', $storeId);
            })
            ->selectRaw('
                COALESCE(SUM(grand_total), 0) as total_omzet,
                COALESCE(SUM(affiliate_fee), 0) as total_affiliate
            ')
            ->first();

        $totalOmzet = (float) $transactionSummary->total_omzet;
        $totalAffiliate = (float) $transactionSummary->total_affiliate;

        // B. Ambil total biaya iklan dari tabel store_daily_ads
        $totalAds = StoreDailyAds::query()
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->when($storeId && $storeId !== 'all', function ($q) use ($storeId) {
                return $q->where('store_id', $storeId);
            })
            ->sum('amount_spent');

        $totalMarketingCost = $totalAds + $totalAffiliate;
        $marketingToOmzetRatio = $totalOmzet > 0 ? round(($totalMarketingCost / $totalOmzet) * 100, 2) : 0;

        $summary = [
            'total_omzet' => $totalOmzet,
            'total_ads' => (float) $totalAds,
            'total_affiliate' => $totalAffiliate,
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
                ->selectRaw('COALESCE(SUM(grand_total), 0) as omzet, COALESCE(SUM(affiliate_fee), 0) as affiliate')
                ->first();

            $ads = StoreDailyAds::where('store_id', $store->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->sum('amount_spent');

            $tOmzet = (float) $omzetAff->omzet;
            $tMarketing = (float) $ads + (float) $omzetAff->affiliate;

            return [
                'store_name' => $store->name,
                'platform' => $store->platform,
                'omzet' => $tOmzet,
                'ads_spent' => (float) $ads,
                'affiliate_fee' => (float) $omzetAff->affiliate,
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
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('finance/ads-affiliate', [
            'summary' => $summary,
            'storePerformance' => $storePerformance,
            'adsExpenses' => $adsExpenses, // Mengisi data utama baris tabel
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

        StoreDailyAds::updateOrCreate(
            [
                'store_id' => $validated['store_id'],
                'date' => $validated['date'],
            ],
            [
                'amount_spent' => $validated['amount_spent'],
                'affiliate_fee' => $validated['affiliate_fee'] ?? 0,
                'description' => $validated['description'] ?? null,
            ]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Biaya iklan berhasil diperbarui!']);

        return back();
    }

    /**
     * Update log pengeluaran iklan terpilih
     */
    public function update(Request $request, $id)
    {
        $userId = Auth::user()->id;
        $userStoreIds = Store::where('user_id', $userId)->pluck('id')->toArray();

        $expense = StoreDailyAds::whereIn('store_id', $userStoreIds)->findOrFail($id);

        $validated = $request->validate([
            'store_id' => 'required|in:' . implode(',', $userStoreIds),
            'amount_spent' => 'required|numeric|min:0',
            'affiliate_fee' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        $expense->update([
            'store_id' => $validated['store_id'],
            'amount_spent' => $validated['amount_spent'],
            'affiliate_fee' => $validated['affiliate_fee'] ?? 0,
            'description' => $validated['description'] ?? null,
        ]);

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

        StoreDailyAds::whereIn('store_id', $userStoreIds)
            ->whereIn('id', $validated['ids'])
            ->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Semua log terpilih berhasil dihapus massal!']);

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

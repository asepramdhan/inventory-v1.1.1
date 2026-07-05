<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

#[Guarded(['id'])]
class StoreDailyAds extends Model
{
    protected $casts = [
        'date' => 'date',
        'amount_spent' => 'float',
        'affiliate_fee' => 'float',
    ];

    /**
     * Booted function untuk menangani otomatisasi pengeluaran iklan ke mutasi kas
     */
    protected static function booted()
    {
        // 1. KETIKA DATA IKLAN BARU DITAMBAHKAN (CREATED)
        static::created(function ($dailyAd) {
            $totalExpense = $dailyAd->amount_spent + $dailyAd->affiliate_fee;
            if ($totalExpense <= 0) return;

            DB::transaction(function () use ($dailyAd, $totalExpense) {
                $store = $dailyAd->store;
                if (!$store) return;

                // Ambil user_id pemilik toko dari relasi tabel stores
                $ownerId = $store->user_id;

                // Ambil akun kas default milik pemilik toko
                $account = FinancialAccount::where('user_id', $ownerId)
                    ->where('is_default', true)
                    ->where('is_active', true)
                    ->first() ?? FinancialAccount::where('user_id', $ownerId)
                    ->where('is_active', true)
                    ->first();

                if (!$account) return;

                // Potong saldo kas utama
                $account->current_balance -= $totalExpense;
                $account->save();

                $storeName = $store->name;
                $platform = ucfirst($store->platform);
                $formattedDate = $dailyAd->date ? $dailyAd->date->format('Ymd') : date('Ymd');
                $refNumber = 'ADS-' . $dailyAd->id . '-' . $formattedDate;

                // Catat jurnal pengeluaran operasional iklan & affiliate harian
                FinancialMutation::create([
                    'user_id' => $ownerId,
                    'financial_account_id' => $account->id,
                    'date' => $dailyAd->date ? $dailyAd->date->toDateString() : now()->toDateString(),
                    'type' => 'expense',
                    'category' => 'Biaya Iklan & Affiliate (' . $platform . ')',
                    'amount' => $totalExpense,
                    'balance_snapshot' => $account->current_balance,
                    'reference_number' => $refNumber,
                    'description' => 'Operasional ' . $storeName . ' | Iklan: Rp ' . number_format($dailyAd->amount_spent, 0, ',', '.') . ' | Affiliate: Rp ' . number_format($dailyAd->affiliate_fee, 0, ',', '.')
                ]);
            });
        });

        // 2. KETIKA DATA IKLAN DIUBAH / DI-UPDATE (UPDATED)
        static::updated(function ($dailyAd) {
            if ($dailyAd->isDirty('amount_spent') || $dailyAd->isDirty('affiliate_fee')) {
                DB::transaction(function () use ($dailyAd) {
                    $store = $dailyAd->store;
                    if (!$store) return;

                    $ownerId = $store->user_id;

                    // Hitung total pengeluaran lama vs baru beserta selisihnya
                    $oldTotal = $dailyAd->getOriginal('amount_spent') + $dailyAd->getOriginal('affiliate_fee');
                    $newTotal = $dailyAd->amount_spent + $dailyAd->affiliate_fee;
                    $diff = $newTotal - $oldTotal;

                    $formattedDate = $dailyAd->getOriginal('date') ? \Carbon\Carbon::parse($dailyAd->getOriginal('date'))->format('Ymd') : date('Ymd');
                    $refNumber = 'ADS-' . $dailyAd->id . '-' . $formattedDate;

                    $oldMutation = FinancialMutation::where('user_id', $ownerId)
                        ->where('reference_number', $refNumber)
                        ->where('type', 'expense')
                        ->first();

                    if ($oldMutation) {
                        $account = FinancialAccount::find($oldMutation->financial_account_id);
                        if ($account) {
                            $account->current_balance -= $diff;
                            $account->save();
                        }

                        $storeName = $store->name;
                        $platform = ucfirst($store->platform);

                        // Ambar pembaruan data nominal mutasi lama
                        $oldMutation->update([
                            'amount' => $newTotal,
                            'balance_snapshot' => $account ? $account->current_balance : $oldMutation->balance_snapshot,
                            'date' => $dailyAd->date ? $dailyAd->date->toDateString() : now()->toDateString(),
                            'description' => 'Operasional ' . $storeName . ' (Update) | Iklan: Rp ' . number_format($dailyAd->amount_spent, 0, ',', '.') . ' | Affiliate: Rp ' . number_format($dailyAd->affiliate_fee, 0, ',', '.')
                        ]);
                    }
                });
            }
        });

        // 3. KETIKA DATA IKLAN DIHAPUS (DELETED)
        static::deleted(function ($dailyAd) {
            DB::transaction(function () use ($dailyAd) {
                $store = $dailyAd->store;
                $ownerId = $store ? $store->user_id : null;

                if (!$ownerId) return;

                $formattedDate = $dailyAd->date ? $dailyAd->date->format('Ymd') : date('Ymd');
                $refNumber = 'ADS-' . $dailyAd->id . '-' . $formattedDate;

                $oldMutation = FinancialMutation::where('user_id', $ownerId)
                    ->where('reference_number', $refNumber)
                    ->where('type', 'expense')
                    ->first();

                if ($oldMutation) {
                    $account = FinancialAccount::find($oldMutation->financial_account_id);
                    if ($account) {
                        // Kembalikan uang pengeluaran iklan ke kas
                        $account->current_balance += $oldMutation->amount;
                        $account->save();
                    }
                    $oldMutation->delete();
                }
            });
        });
    }

    // relasi ke toko
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}

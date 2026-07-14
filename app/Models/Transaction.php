<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use App\Models\OperationalSupply;

#[Guarded(['id'])]
class Transaction extends Model
{
    protected function casts(): array
    {
        return [
            'transaction_date' => 'datetime',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'marketplace_admin_fee' => 'decimal:2',
            'affiliate_fee' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
        ];
    }

    /**
     * Booted function untuk menangani otomatisasi event model
     */
    protected static function booted()
    {
        static::updated(function ($transaction) {
            if ($transaction->isDirty('status') && $transaction->status == 'completed') {

                DB::transaction(function () use ($transaction) {
                    // 1. Ambil Nilai Harta Kotor Pesanan
                    $grossAmount = $transaction->total_amount
                        ?? $transaction->grand_total
                        ?? $transaction->total_price
                        ?? $transaction->total
                        ?? 0;

                    // 2. AMBIL DATA TOKO & BIAYA ADMIN/PROSES SECARA OTOMATIS
                    // Kita asumsikan transaksi Anda punya kolom `store_id`
                    $store = \App\Models\Store::find($transaction->store_id);

                    $adminFee = 0;
                    $processingFee = 0;

                    if ($store) {
                        // Jika admin_fee di database Anda berupa persentase (misal 6% ditulis 6.00)
                        if ($store->admin_fee > 0 && $store->admin_fee < 100) {
                            $adminFee = $grossAmount * ($store->admin_fee / 100);
                        } else {
                            // Jika berupa nominal flat rupiah
                            $adminFee = $store->admin_fee;
                        }

                        // Biaya proses pesanan (misal packing/operasional flat rupiah)
                        $processingFee = $store->processing_fee;
                    }

                    // 3. HITUNG REAL PENCANAN BERSIH YANG MASUK KAS
                    $totalDeductions = $adminFee + $processingFee;
                    $realAmountReceived = $grossAmount - $totalDeductions;

                    // Jika hasil hitungan minus atau nol karena potongan terlalu besar, batalkan pencatatan
                    if ($realAmountReceived <= 0) {
                        return;
                    }

                    // 4. Cari Akun Kas Default yang Aktif
                    $account = FinancialAccount::where('user_id', $transaction->user_id)
                        ->where('is_default', true)
                        ->where('is_active', true)
                        ->first();

                    if (!$account) {
                        $account = FinancialAccount::where('user_id', $transaction->user_id)
                            ->where('is_active', true)
                            ->first();
                    }

                    if (!$account) {
                        return;
                    }

                    // 5. Update Saldo Kas dengan Angka REAL Bersih
                    $account->current_balance += $realAmountReceived;
                    $account->save();

                    // 6. Catat Jurnal Mutasi Kas Masuk Bersih
                    $platformName = $store ? $store->platform : ($transaction->platform ?: 'Toko');
                    $storeName = $store ? $store->name : 'Marketplace';

                    FinancialMutation::create([
                        'user_id' => $transaction->user_id,
                        'financial_account_id' => $account->id,
                        'date' => now()->toDateString(),
                        'type' => 'income',
                        'category' => 'Penjualan (' . ucfirst($platformName) . ' - ' . $storeName . ')',
                        'amount' => $realAmountReceived,
                        'balance_snapshot' => $account->current_balance,
                        'reference_number' => $transaction->invoice_number ?? $transaction->id,
                        'description' => 'Pencairan auto: Rp ' . number_format($grossAmount, 0, ',', '.') .
                            ' | Admin: Rp ' . number_format($adminFee, 0, ',', '.') .
                            ' | Proses: Rp ' . number_format($processingFee, 0, ',', '.')
                    ]);
                });
            }
        });

        // Bagian pembatalan/canceled (tetap aman mengambil dari $oldMutation->amount secara otomatis)
        static::updated(function ($transaction) {
            if ($transaction->isDirty('status') && $transaction->getOriginal('status') == 'completed' && $transaction->status != 'completed') {
                DB::transaction(function () use ($transaction) {
                    $refNumber = $transaction->invoice_number ?? $transaction->id;

                    $oldMutation = FinancialMutation::where('user_id', $transaction->user_id)
                        ->where('reference_number', $refNumber)
                        ->where('type', 'income')
                        ->first();

                    if ($oldMutation) {
                        $account = FinancialAccount::find($oldMutation->financial_account_id);
                        if ($account) {
                            $account->current_balance -= $oldMutation->amount;
                            $account->save();
                        }
                        $oldMutation->delete();
                    }
                });
            }
        });

        static::created(function ($transaction) {
            if ($transaction->status !== 'cancelled') {
                OperationalSupply::deductForTransaction($transaction->user_id, $transaction->invoice_number);
            }
        });

        static::updating(function ($transaction) {
            $oldStatus = $transaction->getOriginal('status');
            $newStatus = $transaction->status;

            if ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                OperationalSupply::deductForTransaction($transaction->user_id, $transaction->invoice_number);
            } elseif ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
                OperationalSupply::refundForTransaction($transaction->user_id, $transaction->invoice_number);
            }
        });

        static::deleting(function ($transaction) {
            if ($transaction->status !== 'cancelled') {
                OperationalSupply::refundForTransaction($transaction->user_id, $transaction->invoice_number);
            }

            // Jika transaksi dihapus dan statusnya completed, hapus mutasi kas otomatisnya
            if ($transaction->status === 'completed') {
                DB::transaction(function () use ($transaction) {
                    $refNumber = $transaction->invoice_number ?? $transaction->id;
                    $oldMutation = FinancialMutation::where('user_id', $transaction->user_id)
                        ->where('reference_number', $refNumber)
                        ->where('type', 'income')
                        ->first();

                    if ($oldMutation) {
                        $account = FinancialAccount::find($oldMutation->financial_account_id);
                        if ($account) {
                            $account->current_balance -= $oldMutation->amount;
                            $account->save();
                        }
                        $oldMutation->delete();
                    }
                });
            }
        });
    }

    // Relasi balik ke User
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Toko asal pesanan
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    // Relasi ke item produk di dalam transaksi ini
    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    // Relasi ke Pelanggan (Customer CRM)
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}

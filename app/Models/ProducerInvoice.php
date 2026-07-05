<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Guarded(['id'])]
class ProducerInvoice extends Model
{
    protected $casts = [
        'received_date' => 'date',
        'paid_date' => 'date',
        'total_amount' => 'float',
    ];

    protected static function booted()
    {
        // KETIKA DATA NOTA DIUPDATE (Misal: Dari Belum Lunas -> Lunas)
        static::updated(function ($invoice) {
            // Jalankan HANYA jika status berubah menjadi 'paid' dan akun kas dipilih
            if ($invoice->isDirty('status') && $invoice->status === 'paid' && $invoice->financial_account_id) {
                DB::transaction(function () use ($invoice) {
                    $account = FinancialAccount::find($invoice->financial_account_id);
                    if (!$account) return;

                    // 1. Potong saldo kas keuangan Anda
                    $account->current_balance -= $invoice->total_amount;
                    $account->save();

                    // 2. Buat otomatis 1 log mutasi keluar di pembukuan kas
                    FinancialMutation::create([
                        'user_id' => $invoice->user_id,
                        'financial_account_id' => $account->id,
                        'date' => $invoice->paid_date ? $invoice->paid_date->toDateString() : now()->toDateString(),
                        'type' => 'expense',
                        'category' => 'Pelunasan Produsen',
                        'amount' => $invoice->total_amount,
                        'balance_snapshot' => $account->current_balance,
                        'reference_number' => $invoice->invoice_number,
                        'description' => 'Pelunasan mingguan stok kepada Produsen: ' . $invoice->producer_name
                    ]);
                });
            }
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProducerInvoiceItem::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinancialAccount::class, 'financial_account_id');
    }

    public function producer(): BelongsTo
    {
        return $this->belongsTo(Producer::class, 'producer_id');
    }
}

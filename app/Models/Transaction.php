<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Guarded(['id'])]
class Transaction extends Model
{
    protected $casts = [
        'transaction_date' => 'datetime',
    ];

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
}

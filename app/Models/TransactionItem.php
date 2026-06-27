<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Guarded(['id'])]
class TransactionItem extends Model
{
    // Relasi balik ke Transaksi Induk
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    // Relasi ke Produk Master
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Guarded(['id'])]
class TransactionItem extends Model
{
    protected function casts(): array
    {
        return [
            'selling_price' => 'decimal:2',
            'hpp_purchase_snapshot' => 'decimal:2',
            'hpp_packaging_snapshot' => 'decimal:2',
            'hpp_operational_snapshot' => 'decimal:2',
            'total_hpp_snapshot' => 'decimal:2',
        ];
    }

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

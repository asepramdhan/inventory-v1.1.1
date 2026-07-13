<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Guarded(['id'])]
class Customer extends Model
{
    // Relasi balik ke User owner
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke transaksi pelanggan ini
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Guarded(['id'])]
class StoreDailyAds extends Model
{
    protected $casts = [
        'date' => 'date',
        'amount_spent' => 'float',
    ];

    // relasi ke toko
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Guarded(['id'])]
class Product extends Model
{
    // relasi ke category
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // relasi ke hpp produk
    public function hpp(): HasOne
    {
        return $this->hasOne(ProductHpp::class);
    }
}

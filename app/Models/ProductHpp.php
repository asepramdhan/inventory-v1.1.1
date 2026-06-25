<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Guarded(['id'])]
class ProductHpp extends Model
{
    // relasi ke product
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

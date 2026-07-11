<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Guarded(['id'])]
class Product extends Model
{
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'active' => 'boolean',
            'landing_active' => 'boolean',
        ];
    }

    protected static function booted()
    {
        static::creating(function ($product) {
            if ($product->landing_active && empty($product->landing_code)) {
                $product->landing_code = static::generateUniqueLandingCode();
            }
        });

        static::updating(function ($product) {
            if ($product->landing_active && empty($product->landing_code)) {
                $product->landing_code = static::generateUniqueLandingCode();
            }
        });
    }

    public static function generateUniqueLandingCode(): string
    {
        do {
            $code = strtolower(\Illuminate\Support\Str::random(8));
        } while (static::where('landing_code', $code)->exists());

        return $code;
    }

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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Guarded(['id'])]
class Store extends Model
{
    protected function casts(): array
    {
        return [
            'admin_fee' => 'decimal:2',
            'processing_fee' => 'decimal:2',
            'active' => 'boolean',
        ];
    }
}

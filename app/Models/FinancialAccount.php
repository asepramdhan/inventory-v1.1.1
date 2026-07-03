<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Guarded(['id'])]
class FinancialAccount extends Model
{
    // relasi ke mutasi
    public function mutations(): HasMany
    {
        return $this->hasMany(FinancialMutation::class)->orderBy('created_at', 'desc')->orderBy('id', 'desc');
    }
}

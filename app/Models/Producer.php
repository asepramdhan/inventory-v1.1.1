<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Guarded(['id'])]
class Producer extends Model
{
    // Relasi: Satu produsen bisa memiliki banyak nota/invoice masuk
    public function invoices(): HasMany
    {
        return $this->hasMany(ProducerInvoice::class);
    }
}

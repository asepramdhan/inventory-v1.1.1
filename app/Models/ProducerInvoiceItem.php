<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Guarded(['id'])]
class ProducerInvoiceItem extends Model
{
    protected $casts = [
        'quantity' => 'integer',
        'cost_per_item' => 'float',
        'subtotal' => 'float',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(ProducerInvoice::class, 'producer_invoice_id');
    }
}

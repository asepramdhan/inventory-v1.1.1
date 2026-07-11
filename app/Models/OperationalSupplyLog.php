<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationalSupplyLog extends Model
{
    protected $fillable = [
        'user_id',
        'operational_supply_id',
        'operational_supply_name',
        'adjustment',
        'source',
        'description',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function operationalSupply(): BelongsTo
    {
        return $this->belongsTo(OperationalSupply::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\OperationalSupplyLog;

class OperationalSupply extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'stock',
        'unit',
        'min_stock',
        'purchase_price',
        'note',
        'auto_deduct',
    ];

    protected $casts = [
        'auto_deduct' => 'boolean',
    ];

    public static function deductForTransaction($userId, $invoiceNumber)
    {
        $supplies = self::where('user_id', $userId)
            ->where('auto_deduct', true)
            ->get();

        foreach ($supplies as $supply) {
            $supply->decrement('stock', 1);

            OperationalSupplyLog::create([
                'user_id' => $userId,
                'operational_supply_id' => $supply->id,
                'operational_supply_name' => $supply->name,
                'adjustment' => -1,
                'source' => 'transaction',
                'description' => "Potong otomatis pesanan #{$invoiceNumber}",
            ]);
        }
    }

    public static function refundForTransaction($userId, $invoiceNumber)
    {
        $supplies = self::where('user_id', $userId)
            ->where('auto_deduct', true)
            ->get();

        foreach ($supplies as $supply) {
            $supply->increment('stock', 1);

            OperationalSupplyLog::create([
                'user_id' => $userId,
                'operational_supply_id' => $supply->id,
                'operational_supply_name' => $supply->name,
                'adjustment' => 1,
                'source' => 'transaction',
                'description' => "Pengembalian pesanan #{$invoiceNumber} (Dibatalkan/Dihapus)",
            ]);
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function logs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OperationalSupplyLog::class);
    }
}

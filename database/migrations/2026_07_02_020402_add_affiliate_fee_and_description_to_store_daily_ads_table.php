<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_daily_ads', function (Blueprint $table) {
            // Menambahkan kolom affiliate_fee dan description setelah kolom amount_spent
            $table->decimal('affiliate_fee', 15, 2)->default(0)->after('amount_spent');
            $table->text('description')->nullable()->after('affiliate_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_daily_ads', function (Blueprint $table) {
            $table->dropColumn(['affiliate_fee', 'description']);
        });
    }
};

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
        // 1. Tambah index pada tabel transactions
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('transaction_date');
            $table->index('status');
        });

        // 2. Tambah index pada tabel financial_mutations
        Schema::table('financial_mutations', function (Blueprint $table) {
            $table->index('date');
            $table->index('type');
            $table->index('category');
        });

        // 3. Tambah index pada tabel store_daily_ads
        Schema::table('store_daily_ads', function (Blueprint $table) {
            $table->index('date');
        });

        // 4. Tambah index pada tabel producer_invoices
        Schema::table('producer_invoices', function (Blueprint $table) {
            $table->index('status');
            $table->index('paid_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Hapus index dari tabel transactions
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['transaction_date']);
            $table->dropIndex(['status']);
        });

        // 2. Hapus index dari tabel financial_mutations
        Schema::table('financial_mutations', function (Blueprint $table) {
            $table->dropIndex(['date']);
            $table->dropIndex(['type']);
            $table->dropIndex(['category']);
        });

        // 3. Hapus index dari tabel store_daily_ads
        Schema::table('store_daily_ads', function (Blueprint $table) {
            $table->dropIndex(['date']);
        });

        // 4. Hapus index dari tabel producer_invoices
        Schema::table('producer_invoices', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['paid_date']);
        });
    }
};

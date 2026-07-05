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
        Schema::table('producer_invoices', function (Blueprint $table) {
            // Kita tambahkan kolom producer_id setelah kolom user_id
            $table->foreignId('producer_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('producer_invoices', function (Blueprint $table) {
            $table->dropForeign(['producer_id']);
            $table->dropColumn('producer_id');
        });
    }
};

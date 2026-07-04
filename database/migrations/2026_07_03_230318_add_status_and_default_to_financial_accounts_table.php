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
        Schema::table('financial_accounts', function (Blueprint $table) {
            // Kolom untuk menonaktifkan akun tanpa menghapus datanya
            $table->boolean('is_active')->default(true)->after('current_balance');
            // Kolom penanda jika ini adalah akun utama penampung pencairan toko
            $table->boolean('is_default')->default(false)->after('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_accounts', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'is_default']);
        });
    }
};

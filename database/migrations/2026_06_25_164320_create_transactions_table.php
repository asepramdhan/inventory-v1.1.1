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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            // Relasi ke User & Toko asal
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();

            // Data Unik Pesanan dari Marketplace / Sistem
            $table->string('invoice_number')->unique(); // Contoh: INV/2026/001 atau Nomor Order Shopee
            $table->string('status'); // 'pending', 'processing', 'completed', 'cancelled', 'returned'

            // Rekap Finansial Utama
            $table->decimal('subtotal', 15, 2)->default(0); // Total harga produk sebelum diskon toko
            $table->decimal('discount', 15, 2)->default(0); // Diskon dari penjual (jika ada)
            $table->decimal('grand_total', 15, 2)->default(0); // Nilai yang dibayar pembeli (Subtotal - Diskon)

            // Biaya Potongan Marketplace Riil saat pesanan selesai
            $table->decimal('marketplace_admin_fee', 15, 2)->default(0); // Potongan admin riil (% + flat)

            // Menambahkan kolom biaya affiliate
            $table->decimal('affiliate_fee', 15, 2)->default(0);

            // Tanggal transaksi dibuat di marketplace (bisa berbeda dengan created_at sistem)
            $table->dateTime('transaction_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

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
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete(); // Null jika produk master dihapus di kemudian hari

            // Informasi Produk saat Terjual
            $table->string('product_name'); // Backup nama jika produk master berubah
            $table->string('product_sku')->nullable();
            $table->integer('quantity');
            $table->decimal('selling_price', 15, 2); // Harga jual per pcs pada saat transaksi ini

            // --- LOCK SNAPSHOT HPP (Kunci untuk Analisa Margin Akurat) ---
            $table->decimal('hpp_purchase_snapshot', 15, 2)->default(0);
            $table->decimal('hpp_packaging_snapshot', 15, 2)->default(0);
            $table->decimal('hpp_operational_snapshot', 15, 2)->default(0);
            $table->decimal('total_hpp_snapshot', 15, 2)->default(0); // Akumulasi total HPP pokok per pcs

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
    }
};

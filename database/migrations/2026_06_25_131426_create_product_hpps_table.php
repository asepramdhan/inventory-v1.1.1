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
        Schema::create('product_hpps', function (Blueprint $table) {
            $table->id();

            // Multi-tenant protection
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Relasi 1-to-1 ke produk master (dikunci dengan unique)
            $table->foreignId('product_id')->unique()->constrained()->onDelete('cascade');

            // Komponen penyusun HPP (Gunakan decimal/bigInteger agar aman dari pembulatan otomatis)
            $table->decimal('purchase_price', 15, 2)->default(0);   // Harga beli asli / biaya bahan baku
            $table->decimal('packaging_cost', 15, 2)->default(0);  // Biaya bubble wrap, kardus, plastik
            $table->decimal('operational_cost', 15, 2)->default(0); // Biaya admin marketplace, ongkir modal, dll
            $table->decimal('total_hpp', 15, 2)->default(0);        // Hasil akhir kalkulasi HPP

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_hpps');
    }
};

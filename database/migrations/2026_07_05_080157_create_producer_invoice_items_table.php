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
        Schema::create('producer_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producer_invoice_id')->constrained()->onDelete('cascade');
            $table->string('item_name'); // Nama barang yang dikirim (misal: Gamis X, Kemeja Y)
            $table->integer('quantity'); // Jumlah pcs/kodi
            $table->decimal('cost_per_item', 15, 2); // Harga modal per pcs dari produsen
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producer_invoice_items');
    }
};

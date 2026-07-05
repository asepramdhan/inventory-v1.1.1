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
        Schema::create('producer_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('producer_name'); // Nama Produsen / Konveksi
            $table->string('invoice_number'); // Nomor Nota / Faktur dari mereka
            $table->date('received_date'); // Tanggal barang datang
            $table->decimal('total_amount', 15, 2)->default(0); // Total tagihan nota ini
            $table->enum('status', ['unpaid', 'paid'])->default('unpaid'); // Status bayar mingguan
            $table->date('paid_date')->nullable(); // Kapan dilunasi
            $table->foreignId('financial_account_id')->nullable()->constrained()->onDelete('set null'); // Dibayar pakai kas apa
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producer_invoices');
    }
};

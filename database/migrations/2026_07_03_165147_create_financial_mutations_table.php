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
        Schema::create('financial_mutations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('financial_account_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->enum('type', ['income', 'expense']); // income = uang masuk, expense = uang keluar
            $table->string('category'); // Contoh: Modal, Iklan, Gaji, Pencairan Omzet
            $table->decimal('amount', 15, 2); // Nominal mutasi
            $table->decimal('balance_snapshot', 15, 2); // Saldo akhir kas tepat setelah mutasi ini dicatat
            $table->string('reference_number')->nullable(); // No invoice, no resi, atau no referensi bank
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_mutations');
    }
};

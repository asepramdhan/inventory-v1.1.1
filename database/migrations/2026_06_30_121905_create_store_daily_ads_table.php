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
        Schema::create('store_daily_ads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('amount_spent', 15, 2)->default(0); // Total biaya iklan hari itu
            $table->timestamps();

            // Proteksi agar tidak ada data iklan ganda di toko & tanggal yang sama
            $table->unique(['store_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_daily_ads');
    }
};

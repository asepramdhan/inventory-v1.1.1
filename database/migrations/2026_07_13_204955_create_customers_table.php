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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('username')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('platform')->default('manual');
            $table->timestamps();

            // Indeks pencarian
            $table->index('user_id');
            $table->index('name');
            $table->index('username');
            $table->index('phone');
            $table->index('platform');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};

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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            // user
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // platform
            $table->string('platform');
            // name
            $table->string('name');
            // biaya admin
            $table->decimal('admin_fee', 15, 2);
            // biaya proses pesanan
            $table->decimal('processing_fee', 15, 2);
            // status
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};

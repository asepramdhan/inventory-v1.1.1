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
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('landing_active')->default(false);
            $table->string('landing_code')->nullable()->unique()->index();
            $table->string('whatsapp_number')->nullable();
            $table->text('whatsapp_message_template')->nullable();
            $table->text('landing_description')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'landing_active',
                'landing_code',
                'whatsapp_number',
                'whatsapp_message_template',
                'landing_description',
            ]);
        });
    }
};

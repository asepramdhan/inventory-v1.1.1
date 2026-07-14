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
            $table->integer('weight')->default(0)->after('price'); // Berat barang dalam gram
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('biteship_area_id')->nullable()->after('platform');
            $table->string('biteship_area_name')->nullable()->after('biteship_area_id');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('courier_name')->nullable()->after('affiliate_fee');
            $table->string('courier_service')->nullable()->after('courier_name');
            $table->decimal('shipping_cost', 15, 2)->default(0)->after('courier_service');
            $table->string('waybill_number')->nullable()->after('shipping_cost');
            $table->string('shipping_status')->nullable()->after('waybill_number');
            $table->string('biteship_order_id')->nullable()->after('shipping_status');
            $table->text('shipping_label_url')->nullable()->after('biteship_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('weight');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['biteship_area_id', 'biteship_area_name']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'courier_name',
                'courier_service',
                'shipping_cost',
                'waybill_number',
                'shipping_status',
                'biteship_order_id',
                'shipping_label_url'
            ]);
        });
    }
};

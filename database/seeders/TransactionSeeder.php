<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Store;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ambil user pertama (pastikan kamu sudah login dengan user ini)
        $user = User::first();
        if (!$user) return;

        // 2. Ambil toko milik user tersebut
        $store = Store::where('user_id', $user->id)->first();
        if (!$store) {
            // Jika belum ada toko, buatkan toko dummy dulu untuk testing
            $store = Store::create([
                'user_id' => $user->id,
                'platform' => 'shopee',
                'name' => 'Toko Testing Shopee',
                'admin_fee' => 6.5,
                'processing_fee' => 1000,
                'active' => true
            ]);
        }

        // 3. Ambil produk milik user yang SUDAH PUNYA DATA HPP
        $products = Product::where('user_id', $user->id)->has('hpp')->take(3)->get();

        if ($products->isEmpty()) {
            $this->command->warn('Harap isi data HPP pada minimal 1 produk terlebih dahulu agar seeder transaksi bisa berjalan!');
            return;
        }

        // 4. Buat 3 Transaksi Dummy dengan tanggal acak (Minggu ini)
        for ($i = 1; $i <= 3; $i++) {
            $invoiceNumber = 'INV/' . Carbon::now()->format('Ymd') . '/' . Str::upper(Str::random(5));

            // Buat Induk Transaksi
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'store_id' => $store->id,
                'invoice_number' => $invoiceNumber,
                'status' => $i == 3 ? 'processing' : 'completed', // ada yang selesai, ada yang diproses
                'subtotal' => 0, // dihitung dinamis di bawah
                'discount' => $i == 2 ? 5000 : 0, // contoh transaksi ke-2 ada diskon toko
                'grand_total' => 0,
                'marketplace_admin_fee' => 0,
                'transaction_date' => Carbon::now()->subDays(rand(0, 5)),
            ]);

            $subtotalSum = 0;

            // Masukkan produk ke dalam transaksi ini (Transaction Items)
            foreach ($products as $product) {
                $qty = rand(1, 2); // jumlah beli acak 1 atau 2 pcs
                $sellingPrice = $product->price;
                $itemTotalSales = $sellingPrice * $qty;
                $subtotalSum += $itemTotalSales;

                // AMBIL SNAPSHOT HPP DARI MODEL RELATIONSHIP (PENTING!)
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $qty,
                    'selling_price' => $sellingPrice,

                    // Mengunci nominal HPP saat detik transaksi ini terjadi
                    'hpp_purchase_snapshot' => $product->hpp->purchase_price,
                    'hpp_packaging_snapshot' => $product->hpp->packaging_cost,
                    'hpp_operational_snapshot' => $product->hpp->operational_cost,
                    'total_hpp_snapshot' => $product->hpp->total_hpp,
                ]);
            }

            // Hitung grand total dan potongan admin riil marketplace
            $grandTotal = $subtotalSum - $transaction->discount;

            // Rumus potongan admin riil shopee = (Harga * %admin) + flat proses
            $adminFeePercentage = floatval($store->admin_fee);
            $processingFeeFlat = floatval($store->processing_fee);
            $calculatedAdminFee = ($grandTotal * $adminFeePercentage / 100) + $processingFeeFlat;

            // Update data finansial final di transaksi induk
            $transaction->update([
                'subtotal' => $subtotalSum,
                'grand_total' => $grandTotal,
                'marketplace_admin_fee' => $calculatedAdminFee
            ]);
        }

        $this->command->info('Berhasil membuat 3 data transaksi dummy beserta HPP Snapshot-nya!');
    }
}

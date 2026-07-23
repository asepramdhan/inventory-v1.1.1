<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('proofs:clean {--days=30}', function () {
    $days = (int) $this->option('days');
    $dateLimit = now()->subDays($days);

    // Cari semua transaksi dengan bukti scan packing yang berusia lebih dari batas hari woy!
    $transactions = \App\Models\Transaction::whereNotNull('package_proof')
        ->where('updated_at', '<', $dateLimit)
        ->get();

    $deletedCount = 0;
    foreach ($transactions as $tx) {
        $files = explode(',', $tx->package_proof);
        foreach ($files as $file) {
            $trimmed = trim($file);
            if ($trimmed) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($trimmed);
            }
        }
        $tx->update([
            'package_proof' => null
        ]);
        $deletedCount++;
    }

    $this->info("Berhasil menghapus bukti packing dari {$deletedCount} transaksi lama (usia > {$days} hari) woy!");
})->purpose('Bersihkan bukti scan packing (foto / video) lama woy');

// Jadwalkan pembersihan harian secara otomatis pukul 01:00 woy
\Illuminate\Support\Facades\Schedule::command('proofs:clean --days=30')->dailyAt('01:00');

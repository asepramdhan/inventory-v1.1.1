<?php

namespace App\Http\Controllers;

use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BackupController extends Controller
{
    protected BackupService $backupService;

    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * Display a listing of backups and stats
     */
    public function index()
    {
        $backups = collect(Storage::disk('local')->files('backups'))
            ->filter(function ($file) {
                return pathinfo($file, PATHINFO_EXTENSION) === 'zip';
            })
            ->map(function ($file) {
                return [
                    'filename' => basename($file),
                    'size' => Storage::disk('local')->size($file),
                    'created_at' => Storage::disk('local')->lastModified($file), // Unix timestamp
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        $totalBackups = $backups->count();
        $totalSize = $backups->sum('size');
        $lastBackup = $backups->first() ? $backups->first()['created_at'] : null;

        // Hitung total kapasitas bukti packing yang terpakai woy!
        $proofFiles = Storage::disk('public')->allFiles('package_proofs');
        $totalProofSize = 0;
        foreach ($proofFiles as $file) {
            try {
                $totalProofSize += Storage::disk('public')->size($file);
            } catch (\Exception $e) {
                // Abaikan jika file corrupt/hilang secara fisik woy
            }
        }

        return Inertia::render('master-data/backup', [
            'backups' => $backups,
            'summary' => [
                'total_backups' => $totalBackups,
                'total_size' => $totalSize,
                'last_backup' => $lastBackup ? date('Y-m-d H:i:s', $lastBackup) : null,
                'proof_total_size' => $totalProofSize,
                'proof_files_count' => count($proofFiles)
            ]
        ]);
    }

    /**
     * Trigger a new database backup creation
     */
    public function create()
    {
        try {
            $this->backupService->createBackup();

            return back()->with('toast', [
                'type' => 'success',
                'message' => 'Backup database baru berhasil dibuat!'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'backup' => 'Gagal membuat backup database: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Download a specific backup file
     */
    public function download(string $filename)
    {
        // Safe filename check to prevent path traversal
        $filename = basename($filename);
        $path = "backups/{$filename}";

        if (!Storage::disk('local')->exists($path)) {
            abort(404, 'File backup tidak ditemukan.');
        }

        return Storage::disk('local')->download($path);
    }

    /**
     * Restore database from a selected local backup file
     */
    public function restore(string $filename)
    {
        $path = Storage::disk('local')->path("backups/{$filename}");

        if (!file_exists($path)) {
            return back()->withErrors([
                'restore' => 'File backup tidak ditemukan pada storage lokal.'
            ]);
        }

        try {
            $this->backupService->restoreBackup($path);

            return back()->with('toast', [
                'type' => 'success',
                'message' => 'Database berhasil dipulihkan ke backup #' . $filename . '! Silakan muat ulang halaman jika ada masalah sesi.'
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'restore' => 'Gagal memulihkan database: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Upload an external backup file and restore the database from it
     */
    public function uploadAndRestore(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:zip|max:51200' // Max 50MB
        ]);

        $file = $request->file('file');

        // Save temporarily in storage/app/backups/
        $tempFilename = 'temp_upload_' . uniqid() . '.zip';
        $tempPath = $file->storeAs('backups', $tempFilename, 'local');
        $fullPath = Storage::disk('local')->path($tempPath);

        try {
            $this->backupService->restoreBackup($fullPath);

            // Clean up the temporary upload file
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return back()->with('toast', [
                'type' => 'success',
                'message' => 'Database berhasil dipulihkan dari file unggahan Anda!'
            ]);
        } catch (\Exception $e) {
            // Clean up on failure
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            return back()->withErrors([
                'restore' => 'Gagal memulihkan database dari file unggahan: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a backup file
     */
    public function destroy(string $filename)
    {
        $filename = basename($filename);
        $path = "backups/{$filename}";

        if (Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);

            return back()->with('toast', [
                'type' => 'success',
                'message' => 'File backup berhasil dihapus dari server!'
            ]);
        }

        return back()->withErrors([
            'backup' => 'Gagal menghapus: File tidak ditemukan.'
        ]);
    }

    /**
     * Bersihkan bukti packing (foto / video) lama woy!
     */
    public function cleanProofs(Request $request)
    {
        $request->validate([
            'age_days' => 'required|integer|in:14,30,60'
        ]);

        $days = (int) $request->age_days;
        $dateLimit = now()->subDays($days);

        // Cari transaksi di bawah kepemilikan Admin ini yang sudah berumur lebih dari batas woy!
        $transactions = \App\Models\Transaction::where('user_id', \Illuminate\Support\Facades\Auth::user()->getOwnerId())
            ->whereNotNull('package_proof')
            ->where('updated_at', '<', $dateLimit)
            ->get();

        $deletedCount = 0;
        foreach ($transactions as $tx) {
            $files = explode(',', $tx->package_proof);
            foreach ($files as $file) {
                $trimmed = trim($file);
                if ($trimmed) {
                    Storage::disk('public')->delete($trimmed);
                }
            }
            $tx->update([
                'package_proof' => null
            ]);
            $deletedCount++;
        }

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'Berhasil membersihkan bukti packing dari ' . $deletedCount . ' transaksi lama woy!'
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

// IMPORT CLASS PHPSPREADSHEET
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class StoreController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $platform = $request->input('platform');
        $status = $request->input('status');

        $stores = Store::where('user_id', Auth::user()->getOwnerId())
            // Filter Pencarian
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('platform', 'like', "%{$search}%");
                });
            })
            // Filter Platform (Shopee, Lazada, Tiktok)
            ->when($platform && $platform !== 'all', function ($query) use ($platform) {
                return $query->where('platform', $platform);
            })
            // Filter Status Aktif/Tidak Aktif
            ->when($status && $status !== 'all', function ($query) use ($status) {
                $isActive = $status === 'active' ? 1 : 0;
                return $query->where('active', $isActive);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString(); // Memastikan parameter ?search tetap terbawa di link paginasi

        return Inertia::render('master-data/store', [
            'stores' => $stores,
            'filters' => [
                'search' => $search ?? '',
                'platform' => $platform ?? 'all',
                'status' => $status ?? 'all',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'admin_fee' => 'required|numeric|min:0',
            'processing_fee' => 'required|numeric|min:0',
            'active' => 'required|boolean',
        ]);

        Store::create($validated + ['user_id' => Auth::user()->getOwnerId()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Toko / Marketplace berhasil ditambahkan.']);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'platform' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'admin_fee' => 'required|numeric|min:0',
            'processing_fee' => 'required|numeric|min:0',
            'active' => 'required|boolean',
        ]);

        // Cari toko berdasarkan ID DAN pastikan milik user yang sedang login
        $store = Store::where('id', $id)
            ->where('user_id', Auth::user()->getOwnerId())
            ->firstOrFail(); // Otomatis return 404 jika bukan pemiliknya

        // Eksekusi update data
        $store->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Toko / Marketplace berhasil diperbarui.'
        ]);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Pastikan data yang dicari adalah milik user yang sedang login
        $store = Store::where('id', $id)
            ->where('user_id', Auth::user()->getOwnerId())
            ->firstOrFail(); // Akan otomatis 404 jika ID salah atau bukan milik user tersebut

        $store->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Toko / Marketplace berhasil dihapus.'
        ]);

        return to_route('stores.index');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:stores,id', // Validasi memastikan ID-nya benar-benar ada di tabel stores
        ]);

        // Hapus data secara massal, pastikan hanya menghapus milik user yang sedang login
        $deletedCount = Store::whereIn('id', $request->ids)
            ->where('user_id', Auth::user()->getOwnerId())
            ->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$deletedCount} Toko berhasil dihapus sekaligus."
        ]);

        return back();
    }

    public function export(Request $request)
    {
        $request->validate([
            'ids' => 'required|string',
        ]);

        // Mengubah string id kembali menjadi array
        $idsArray = explode(',', $request->ids);

        // Ambil data toko milik user yang sedang login (Proteksi IDOR)
        $stores = Store::whereIn('id', $idsArray)
            ->where('user_id', Auth::user()->getOwnerId())
            ->get();

        // Nama file berakhiran .xlsx
        $fileName = 'Laporan_Toko_' . date('Y-m-d_H-i-s') . '.xlsx';

        // 1. Inisialisasi Spreadsheet Baru
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 2. Tulis Header Kolom (Baris 1)
        $sheet->setCellValue('A1', 'Tanggal');
        $sheet->setCellValue('B1', 'Platform');
        $sheet->setCellValue('C1', 'Nama Toko');
        $sheet->setCellValue('D1', 'Biaya Admin (%)');
        $sheet->setCellValue('E1', 'Biaya Proses (Rp)');
        $sheet->setCellValue('F1', 'Status');

        // 3. Styling Header agar Tebal (Bold)
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        // 4. Looping untuk Mengisi Baris Data (Dimulai dari Baris 2)
        $row = 2;
        foreach ($stores as $store) {
            $sheet->setCellValue('A' . $row, $store->created_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue('B' . $row, ucfirst($store->platform));
            $sheet->setCellValue('C' . $row, $store->name);
            $sheet->setCellValue('D' . $row, (float) $store->admin_fee / 100);
            $sheet->setCellValue('E' . $row, $store->processing_fee);
            $sheet->setCellValue('F' . $row, $store->active ? 'Aktif' : 'Tidak Aktif');
            $row++;
        }

        if ($row > 2) {
            // 1. FORMAT PERSEN TANPA DESIMAL (Kolom D)
            $sheet->getStyle('D2:D' . ($row - 1))
                ->getNumberFormat()
                ->setFormatCode('0%'); // <--- '0%' artinya angka bulat tanpa desimal

            // 2. FORMAT RUPIAH (Kolom E) yang sudah kita buat sebelumnya
            $sheet->getStyle('E2:E' . ($row - 1))
                ->getNumberFormat()
                ->setFormatCode('"Rp"#,##0');

            $sheet->getStyle('E2:E' . ($row - 1))
                ->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
        }

        // 5. Otomatis Mengatur Lebar Kolom (Auto Size) agar tidak terpotong (###) di Excel
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // 6. Siapkan Proses Writer ke format XLSX
        $writer = new Xlsx($spreadsheet);

        // 7. Stream data langsung ke Browser untuk diunduh
        $response = new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        });

        // 8. Atur HTTP Header khusus untuk dokumen Excel (.xlsx)
        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }
}

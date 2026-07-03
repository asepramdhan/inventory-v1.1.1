<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductHpp;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductHppController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $category = $request->input('category');
        $status = $request->input('status');

        $products = Product::with(['category', 'hpp']) // Eager load kategori & hpp sekaligus
            ->where('user_id', Auth::user()->id)

            // Filter Pencarian (Nama, SKU)
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })

            // Filter Kategori
            ->when($category && $category !== 'all', function ($query) use ($category) {
                return $query->where('category_id', $category);
            })

            // Filter Status Aktif Produk
            ->when($status && $status !== 'all', function ($query) use ($status) {
                $isActive = $status === 'active' ? 1 : 0;
                return $query->where('active', $isActive);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // Ambil list kategori untuk filter dropdown
        $categoriesList = Category::where('user_id', Auth::user()->id)
            ->select('id', 'name')
            ->get();

        // AMBIL DAFTAR TOKO MILIK USER
        $storesList = Store::where('user_id', Auth::user()->id)
            ->where('active', true)
            ->select('id', 'name', 'platform', 'admin_fee', 'processing_fee')
            ->get();

        return Inertia::render('master-data/product-hpp', [ // Sesuaikan dengan path file React kamu
            'products' => $products,
            'categoriesList' => $categoriesList,
            'storesList' => $storesList,
            'filters' => [
                'search' => $search ?? '',
                'category' => $category ?? 'all',
                'status' => $status ?? 'all',
            ],
        ]);
    }

    public function save(Request $request)
    {
        // Validasi input form HPP
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'purchase_price' => 'required|numeric|min:0',
            'packaging_cost' => 'nullable|numeric|min:0',
            'operational_cost' => 'nullable|numeric|min:0',
            'total_hpp' => 'required|numeric|min:0',
        ]);

        // Taktik cerdas: Karena relasinya 1-to-1, gunakan updateOrCreate.
        // Jika data hpp dengan product_id tersebut belum ada, maka akan di-insert (Create).
        // Jika sudah ada, otomatis di-update.
        ProductHpp::updateOrCreate(
            [
                'product_id' => $request->product_id,
                'user_id' => Auth::user()->id
            ],
            [
                'purchase_price' => $request->purchase_price,
                'packaging_cost' => $request->packaging_cost ?? 0,
                'operational_cost' => $request->operational_cost ?? 0,
                'total_hpp' => $request->total_hpp,
            ]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk HPP berhasil disimpan!']);

        return back();
    }

    public function export(Request $request)
    {
        $request->validate([
            'ids' => 'required|string',
        ]);

        // Mengubah string id kembali menjadi array
        $idsArray = explode(',', $request->ids);

        // Ambil data produk hpp milik user yang sedang login (Proteksi IDOR)
        $productHpps = Product::whereIn('id', $idsArray)
            ->where('user_id', Auth::user()->id)
            ->get();

        // Nama file berakhiran .xlsx
        $fileName = 'Daftar_Produk_HPP_' . date('Y-m-d_H-i-s') . '.xlsx';

        // 1. Inisialisasi Spreadsheet Baru
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 2. Tulis Header Kolom (Baris 1)
        $sheet->setCellValue('A1', 'Tanggal');
        $sheet->setCellValue('B1', 'SKU');
        $sheet->setCellValue('C1', 'Nama Produk');
        $sheet->setCellValue('D1', 'Harga Jual');
        $sheet->setCellValue('E1', 'Total HPP');
        $sheet->setCellValue('F1', 'Margin Bersih');

        // 3. Styling Header agar Tebal (Bold)
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);

        // 4. Looping untuk Mengisi Baris Data (Dimulai dari Baris 2)
        $row = 2;
        foreach ($productHpps as $productHpp) {
            $sheet->setCellValue('A' . $row, $productHpp->created_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue('B' . $row, trim($productHpp->sku));
            $sheet->setCellValue('C' . $row, $productHpp->name);
            $sheet->setCellValue('D' . $row, $productHpp->price);
            $sheet->setCellValue('E' . $row, $productHpp->hpp->total_hpp);
            $sheet->setCellValue('F' . $row, $productHpp->price - $productHpp->hpp->total_hpp);
            $row++;
        }

        if ($row > 2) {
            $sheet->getStyle('D2:D' . ($row - 1))
                ->getNumberFormat()
                ->setFormatCode('"Rp"#,##0');

            $sheet->getStyle('D2:D' . ($row - 1))
                ->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);

            $sheet->getStyle('E2:E' . ($row - 1))
                ->getNumberFormat()
                ->setFormatCode('"Rp"#,##0');

            $sheet->getStyle('E2:E' . ($row - 1))
                ->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);

            $sheet->getStyle('F2:F' . ($row - 1))
                ->getNumberFormat()
                ->setFormatCode('"Rp"#,##0');

            $sheet->getStyle('F2:F' . ($row - 1))
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

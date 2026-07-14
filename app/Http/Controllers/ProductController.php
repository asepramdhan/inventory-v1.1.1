<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\ProductHpp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $category = $request->input('category');
        $status = $request->input('status');

        $products = Product::with(['category', 'hpp']) // Eager load relasi 'category' & 'hpp'
            ->where('user_id', Auth::user()->id)
            // Filter Pencarian (Nama, SKU atau Kategori)
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereHas('category', function ($categoryQuery) use ($search) {
                            $categoryQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            // Filter Category
            ->when($category && $category !== 'all', function ($query) use ($category) {
                return $query->where('category_id', $category);
            })
            // Filter Status (Aktif / Tidak Aktif)
            ->when($status && $status !== 'all', function ($query) use ($status) {
                $isActive = $status === 'active' ? 1 : 0;
                return $query->where('active', $isActive);
            })
            ->latest()
            ->paginate(50)
            ->withQueryString();

        // Calculate 30-day average daily sales (ADS) and Reorder Point (ROP) for forecasting
        $startDate30DaysAgo = now()->subDays(30)->format('Y-m-d 00:00:00');
        $sales30Days = \Illuminate\Support\Facades\DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereIn('transaction_items.product_id', $products->pluck('id'))
            ->where('transactions.status', '!=', 'cancelled')
            ->whereBetween('transactions.transaction_date', [$startDate30DaysAgo, now()->format('Y-m-d 23:59:59')])
            ->selectRaw('transaction_items.product_id, SUM(transaction_items.quantity) as total_qty')
            ->groupBy('transaction_items.product_id')
            ->pluck('total_qty', 'product_id')
            ->toArray();

        $products->through(function ($product) use ($sales30Days) {
            $sales30 = (int) ($sales30Days[$product->id] ?? 0);
            $avgSales = (float) ($sales30 / 30.0);
            
            $product->sales_30_days = $sales30;
            $product->average_daily_sales = round($avgSales, 2);
            $product->reorder_point = (int) ceil(($avgSales * $product->lead_time_days) + $product->safety_stock_units);
            
            return $product;
        });

        // AMBIL DAFTAR KATEGORI MILIK USER (Kirim ke React Form)
        $categoriesList = Category::where('user_id', Auth::user()->id)
            ->select('id', 'name', 'active')
            ->get();

        // AMBIL DAFTAR TOKO MILIK USER (Kirim ke React Form HPP)
        $storesList = Store::where('user_id', Auth::user()->id)
            ->where('active', true)
            ->select('id', 'name', 'platform', 'admin_fee', 'processing_fee')
            ->get();

        return Inertia::render('operational/product', [
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
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', Auth::user()->id)
            ],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048', // Maks 2MB
            'sku' => 'required|string|unique:products,sku|max:255',
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'weight' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'active'      => 'required|boolean',
            'landing_active' => 'required|boolean',
            'landing_code' => 'nullable|string|max:50|unique:products,landing_code',
            'whatsapp_number' => 'nullable|string|max:50',
            'whatsapp_message_template' => 'nullable|string',
            'landing_description' => 'nullable|string',
            'lead_time_days' => 'required|integer|min:1',
            'safety_stock_units' => 'required|integer|min:0',
            'gallery_files' => 'nullable|array',
            'gallery_files.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Logika Upload Gambar
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        // Logika Upload Galeri Gambar
        if ($request->hasFile('gallery_files')) {
            $galleryPaths = [];
            foreach ($request->file('gallery_files') as $file) {
                $path = $file->store('products/gallery', 'public');
                $galleryPaths[] = '/storage/' . $path;
            }
            $validated['gallery'] = json_encode($galleryPaths);
        }

        Product::create($validated + ['user_id' => Auth::user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil ditambahkan.']);

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
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where('user_id', Auth::user()->id)
            ],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'sku' => 'required|string|unique:products,sku,' . $id . '|max:255',
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'weight' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'active'      => 'required|boolean',
            'landing_active' => 'required|boolean',
            'landing_code' => 'nullable|string|max:50|unique:products,landing_code,' . $id,
            'whatsapp_number' => 'nullable|string|max:50',
            'whatsapp_message_template' => 'nullable|string',
            'landing_description' => 'nullable|string',
            'lead_time_days' => 'required|integer|min:1',
            'safety_stock_units' => 'required|integer|min:0',
            'gallery_files' => 'nullable|array',
            'gallery_files.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $product = Product::where('id', $id)
            ->where('user_id', Auth::user()->id)
            ->firstOrFail();

        // Logika Update Gambar
        if ($request->hasFile('image')) {
            // Hapus gambar lama jika ada untuk menghemat kapasitas server
            if ($product->image) {
                $oldPath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        // Logika Update Galeri Gambar
        if ($request->hasFile('gallery_files')) {
            // Hapus galeri gambar lama
            if ($product->gallery) {
                $oldGallery = json_decode($product->gallery, true) ?? [];
                foreach ($oldGallery as $oldItem) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $oldItem));
                }
            }

            $galleryPaths = [];
            foreach ($request->file('gallery_files') as $file) {
                $path = $file->store('products/gallery', 'public');
                $galleryPaths[] = '/storage/' . $path;
            }
            $validated['gallery'] = json_encode($galleryPaths);
        }

        $product->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil diperbarui.']);

        return back();
    }

    public function updateStock(Request $request, Product $product)
    {
        $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $product->update([
            'stock' => $request->stock
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Stok berhasil diperbarui secara instan!']);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::where('id', $id)
            ->where('user_id', Auth::user()->id)
            ->firstOrFail();

        if ($product->image) {
            $oldPath = str_replace('/storage/', '', $product->image);
            Storage::disk('public')->delete($oldPath);
        }

        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil dihapus.']);

        return back();
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id'
        ]);

        // Pastikan hanya menghapus produk milik user yang sedang login
        $products = Product::where('user_id', Auth::user()->id)
            ->whereIn('id', $request->ids);

        // Hapus data secara massal dan hapus juga gambar jika ada
        $products->each(function ($product) {
            if ($product->image) {
                $oldPath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }
            $product->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk terpilih berhasil dihapus.']);

        return back();
    }

    public function export(Request $request)
    {
        $request->validate([
            'ids' => 'required|string',
        ]);

        // Mengubah string id kembali menjadi array
        $idsArray = explode(',', $request->ids);

        // Ambil data produk milik user yang sedang login (Proteksi IDOR)
        $products = Product::whereIn('id', $idsArray)
            ->where('user_id', Auth::user()->id)
            ->get();

        // Nama file berakhiran .xlsx
        $fileName = 'Daftar_Master_Produk_' . date('Y-m-d_H-i-s') . '.xlsx';

        // 1. Inisialisasi Spreadsheet Baru
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 2. Tulis Header Kolom (Baris 1)
        $sheet->setCellValue('A1', 'Tanggal');
        $sheet->setCellValue('B1', 'SKU');
        $sheet->setCellValue('C1', 'Nama Produk');
        $sheet->setCellValue('D1', 'Kategori');
        $sheet->setCellValue('E1', 'Stok');
        $sheet->setCellValue('F1', 'Harga Jual');
        $sheet->setCellValue('G1', 'Status');

        // 3. Styling Header agar Tebal (Bold)
        $sheet->getStyle('A1:G1')->getFont()->setBold(true);

        // 4. Looping untuk Mengisi Baris Data (Dimulai dari Baris 2)
        $row = 2;
        foreach ($products as $product) {
            $sheet->setCellValue('A' . $row, $product->created_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue('B' . $row, trim($product->sku));
            $sheet->setCellValue('C' . $row, $product->name);
            $sheet->setCellValue('D' . $row, $product->category->name);
            $sheet->setCellValue('E' . $row, $product->stock);
            $sheet->setCellValue('F' . $row, $product->price);
            $sheet->setCellValue('G' . $row, $product->active ? 'Aktif' : 'Tidak Aktif');
            $row++;
        }

        if ($row > 2) {
            $sheet->getStyle('F2:F' . ($row - 1))
                ->getNumberFormat()
                ->setFormatCode('"Rp"#,##0');

            $sheet->getStyle('F2:F' . ($row - 1))
                ->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
        }

        // 5. Otomatis Mengatur Lebar Kolom (Auto Size) agar tidak terpotong (###) di Excel
        foreach (range('A', 'G') as $col) {
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

    public function saveHpp(Request $request)
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

    public function exportHpp(Request $request)
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
            $sheet->setCellValue('E' . $row, $productHpp->hpp ? $productHpp->hpp->total_hpp : 0);
            $sheet->setCellValue('F' . $row, $productHpp->price - ($productHpp->hpp ? $productHpp->hpp->total_hpp : 0));
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

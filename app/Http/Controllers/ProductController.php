<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
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

        $products = Product::with('category') // Eager load relasi 'category'
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
            ->paginate(10)
            ->withQueryString();

        // AMBIL DAFTAR KATEGORI MILIK USER (Kirim ke React Form)
        $categoriesList = Category::where('user_id', Auth::user()->id)
            ->select('id', 'name', 'active')
            ->get();

        return Inertia::render('master-data/product', [
            'products' => $products,
            'categoriesList' => $categoriesList,
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
            'description' => 'nullable|string',
            'active'      => 'required|boolean',
        ]);

        // Logika Upload Gambar
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        Product::create($validated + ['user_id' => Auth::user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil ditambahkan.']);

        return to_route('products.index');
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
            'description' => 'nullable|string',
            'active'      => 'required|boolean',
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

        $product->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Produk berhasil diperbarui.']);

        return to_route('products.index');
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

        return to_route('products.index');
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

        return to_route('products.index');
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
}

<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductHpp;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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

        return to_route('product-hpp.index');
    }
}

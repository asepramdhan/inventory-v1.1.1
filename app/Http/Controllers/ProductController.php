<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

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

    // Tambahkan Method Export Excel placeholder jika diperlukan
    public function export(Request $request)
    {
        $ids = $request->query('ids');
        // Logika export Excel menggunakan Maatwebsite Excel atau library pilihanmu...
    }
}

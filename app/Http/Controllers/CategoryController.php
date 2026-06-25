<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $categories = Category::where('user_id', Auth::user()->id)
            // Filter Pencarian
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            })
            // Filter Status Aktif/Tidak Aktif
            ->when($status && $status !== 'all', function ($query) use ($status) {
                $isActive = $status === 'active' ? 1 : 0;
                return $query->where('active', $isActive);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString(); // Memastikan parameter ?search tetap terbawa di link paginasi

        return Inertia::render('master-data/category', [
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
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
            'name' => 'required|string|max:255',
            'active' => 'required|boolean',
        ]);

        Category::create($validated + ['user_id' => Auth::user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil ditambahkan.']);

        return to_route('categories.index');
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
            'name' => 'required|string|max:255',
            'active' => 'required|boolean',
        ]);

        $category = Category::where('user_id', Auth::user()->id)->findOrFail($id);

        $category->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil diperbarui.']);

        return to_route('categories.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::where('user_id', Auth::user()->id)->findOrFail($id);

        $category->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kategori berhasil dihapus.']);

        return to_route('categories.index');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:categories,id', // Validasi memastikan ID-nya benar-benar ada di tabel categories
        ]);

        // Hapus data secara massal, pastikan hanya menghapus milik user yang sedang login
        $deletedCount = Category::whereIn('id', $request->ids)
            ->where('user_id', Auth::user()->id)
            ->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$deletedCount} Kategori berhasil dihapus sekaligus."
        ]);

        return to_route('categories.index');
    }

    // Tambahkan Method Export Excel placeholder jika diperlukan
    public function export(Request $request)
    {
        $ids = $request->query('ids');
        // Logika export Excel menggunakan Maatwebsite Excel atau library pilihanmu...
    }
}

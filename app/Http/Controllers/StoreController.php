<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StoreController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');

        $stores = Store::where('user_id', Auth::user()->id)
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('platform', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString(); // Memastikan parameter ?search tetap terbawa di link paginasi

        return Inertia::render('master-data/store', [
            'stores' => $stores,
            'filters' => [
                'search' => $search ?? '',
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

        Store::create($validated + ['user_id' => Auth::user()->id]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Toko / Marketplace berhasil ditambahkan.']);

        return to_route('stores.index');
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
            ->where('user_id', Auth::user()->id)
            ->firstOrFail(); // Otomatis return 404 jika bukan pemiliknya

        // Eksekusi update data
        $store->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Toko / Marketplace berhasil diperbarui.'
        ]);

        return to_route('stores.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Pastikan data yang dicari adalah milik user yang sedang login
        $store = Store::where('id', $id)
            ->where('user_id', Auth::user()->id)
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
            ->where('user_id', Auth::user()->id)
            ->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$deletedCount} Toko berhasil dihapus sekaligus."
        ]);

        return to_route('stores.index');
    }
}

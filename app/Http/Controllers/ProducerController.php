<?php

namespace App\Http\Controllers;

use App\Models\Producer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProducerController extends Controller
{
    // Menampilkan halaman utama daftar produsen beserta ringkasan hutangnya
    public function index()
    {
        $userId = Auth::user()->id;

        // Ambil semua produsen milik user yang login
        $producers = Producer::where('user_id', $userId)
            ->with(['invoices' => function ($query) {
                $query->where('status', 'unpaid'); // Ambil nota yang belum lunas untuk hitung sisa hutang
            }])
            ->get()
            ->map(function ($producer) {
                // Hitung sisa hutang berjalan secara dinamis untuk produsen ini
                $producer->total_unpaid_debt = (float) $producer->invoices->sum('total_amount');
                return $producer;
            });

        return Inertia::render('master-data/producers', [
            'producers' => $producers
        ]);
    }

    // Menyimpan data master produsen baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Producer::create([
            'user_id' => Auth::user()->id,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'notes' => $validated['notes'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Master data produsen berhasil ditambahkan!']);
        return back();
    }
}

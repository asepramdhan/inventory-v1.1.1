<?php

namespace App\Http\Controllers;

use App\Models\Producer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProducerController extends Controller
{
    // Menampilkan halaman utama daftar produsen beserta ringkasan hutangnya
    public function index()
    {
        $userId = Auth::user()->id;

        $producers = Producer::where('user_id', $userId)
            ->withCount('invoices')
            ->with(['invoices' => function ($query) {
                $query->where('status', 'unpaid');
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($producer) {
                $producer->total_unpaid_debt = (float) $producer->invoices->sum(
                    fn ($invoice) => $invoice->total_amount - ($invoice->paid_amount ?? 0)
                );

                return $producer;
            });

        return Inertia::render('master-data/producers', [
            'producers' => $producers,
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

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $userId = Auth::user()->id;
        $producer = Producer::where('user_id', $userId)->findOrFail($id);

        DB::transaction(function () use ($producer, $validated) {
            $oldName = $producer->name;

            $producer->update($validated);

            if ($producer->name !== $oldName) {
                $producer->invoices()->update(['producer_name' => $producer->name]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data produsen berhasil diperbarui!']);

        return back();
    }

    public function destroy(string $id)
    {
        $userId = Auth::user()->id;
        $producer = Producer::where('user_id', $userId)->findOrFail($id);

        if ($producer->invoices()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Produsen tidak dapat dihapus karena masih memiliki catatan nota.',
            ]);

            return back();
        }

        $producer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Master data produsen berhasil dihapus!']);

        return back();
    }
}

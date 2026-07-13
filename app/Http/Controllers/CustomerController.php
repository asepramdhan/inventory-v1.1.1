<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers with aggregated stats.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $platform = $request->input('platform');

        $customers = Customer::where('user_id', Auth::id())
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->when($platform && $platform !== 'all', function ($query) use ($platform) {
                return $query->where('platform', $platform);
            })
            ->withCount('transactions')
            ->withSum('transactions', 'grand_total')
            ->orderBy('transactions_count', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('master-data/customers', [
            'customers' => $customers,
            'filters' => [
                'search' => $search ?? '',
                'platform' => $platform ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'platform' => 'required|string|max:255',
        ]);

        Customer::create($validated + ['user_id' => Auth::id()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pelanggan berhasil didaftarkan.']);

        return back();
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(Request $request, $id)
    {
        $customer = Customer::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'platform' => 'required|string|max:255',
        ]);

        $customer->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data pelanggan berhasil diperbarui.']);

        return back();
    }

    /**
     * Remove the specified customer from storage.
     */
    public function destroy($id)
    {
        $customer = Customer::where('user_id', Auth::id())->findOrFail($id);
        
        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data pelanggan berhasil dihapus.']);

        return back();
    }
}

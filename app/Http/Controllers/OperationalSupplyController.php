<?php

namespace App\Http\Controllers;

use App\Models\OperationalSupply;
use App\Models\OperationalSupplyLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OperationalSupplyController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'all');

        $query = OperationalSupply::where('user_id', Auth::user()->getOwnerId());

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status === 'low') {
            $query->whereColumn('stock', '<=', 'min_stock');
        } elseif ($status === 'safe') {
            $query->whereColumn('stock', '>', 'min_stock');
        }

        // Summary metrics
        $totalItems = OperationalSupply::where('user_id', Auth::user()->getOwnerId())->count();
        $lowStockItems = OperationalSupply::where('user_id', Auth::user()->getOwnerId())
            ->whereColumn('stock', '<=', 'min_stock')
            ->count();
        $safeStockItems = $totalItems - $lowStockItems;

        $supplies = $query->latest()
            ->paginate(50)
            ->withQueryString();

        $logs = OperationalSupplyLog::where('user_id', Auth::user()->getOwnerId())
            ->with('operationalSupply')
            ->latest()
            ->paginate(50, ['*'], 'logs_page')
            ->withQueryString();

        return Inertia::render('operational/supplies', [
            'supplies' => $supplies,
            'logs' => $logs,
            'summary' => [
                'total_items' => $totalItems,
                'low_stock_items' => $lowStockItems,
                'safe_stock_items' => $safeStockItems,
            ],
            'filters' => [
                'search' => $search ?? '',
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'purchase_price' => 'required|integer|min:0',
            'note' => 'nullable|string',
            'auto_deduct' => 'nullable|boolean',
        ]);

        $supply = OperationalSupply::create([
            'user_id' => Auth::user()->getOwnerId(),
            'name' => $request->name,
            'stock' => $request->stock,
            'unit' => $request->unit,
            'min_stock' => $request->min_stock,
            'purchase_price' => $request->purchase_price,
            'note' => $request->note,
            'auto_deduct' => $request->boolean('auto_deduct', false),
        ]);

        // Log stok awal
        OperationalSupplyLog::create([
            'user_id' => Auth::user()->getOwnerId(),
            'operational_supply_id' => $supply->id,
            'operational_supply_name' => $supply->name,
            'adjustment' => $supply->stock,
            'source' => 'manual',
            'description' => 'Stok awal bahan dibuat',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan operasional berhasil ditambahkan!']);

        return back();
    }

    public function update(Request $request, $id)
    {
        $supply = OperationalSupply::where('user_id', Auth::user()->getOwnerId())->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'purchase_price' => 'required|integer|min:0',
            'note' => 'nullable|string',
            'auto_deduct' => 'nullable|boolean',
        ]);

        $oldStock = $supply->stock;
        $newStock = (int) $request->stock;

        $supply->update([
            'name' => $request->name,
            'stock' => $request->stock,
            'unit' => $request->unit,
            'min_stock' => $request->min_stock,
            'purchase_price' => $request->purchase_price,
            'note' => $request->note,
            'auto_deduct' => $request->boolean('auto_deduct', false),
        ]);

        // Log jika stok berubah
        if ($oldStock !== $newStock) {
            $adjustment = $newStock - $oldStock;
            OperationalSupplyLog::create([
                'user_id' => Auth::user()->getOwnerId(),
                'operational_supply_id' => $supply->id,
                'operational_supply_name' => $supply->name,
                'adjustment' => $adjustment,
                'source' => 'manual',
                'description' => "Penyesuaian stok (Manual Edit): {$oldStock} -> {$newStock}",
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan operasional berhasil diperbarui!']);

        return back();
    }

    public function destroy($id)
    {
        $supply = OperationalSupply::where('user_id', Auth::user()->getOwnerId())->findOrFail($id);
        $supply->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan operasional berhasil dihapus!']);

        return back();
    }

    public function updateStock(Request $request, $id)
    {
        $supply = OperationalSupply::where('user_id', Auth::user()->getOwnerId())->findOrFail($id);

        $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $oldStock = $supply->stock;
        $newStock = (int) $request->stock;

        $supply->update([
            'stock' => $request->stock,
        ]);

        if ($oldStock !== $newStock) {
            $adjustment = $newStock - $oldStock;
            OperationalSupplyLog::create([
                'user_id' => Auth::user()->getOwnerId(),
                'operational_supply_id' => $supply->id,
                'operational_supply_name' => $supply->name,
                'adjustment' => $adjustment,
                'source' => 'quick_update',
                'description' => "Pembaruan cepat stok (Quick Update): {$oldStock} -> {$newStock}",
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Stok bahan berhasil diperbarui!']);

        return back();
    }

    private function resolveMobileUser(Request $request)
    {
        $token = $request->bearerToken() ?? $request->header('X-Mobile-Token');
        if ($token) {
            try {
                $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($token);
                $parts = explode('|', $decrypted);
                return \App\Models\User::find($parts[0]);
            } catch (\Exception $e) {
                return null;
            }
        }
        return Auth::user();
    }

    public function listSupplies(Request $request)
    {
        $user = $this->resolveMobileUser($request);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $supplies = OperationalSupply::where('user_id', $user->getOwnerId())
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'supplies' => $supplies
        ]);
    }

    public function updateSupplyStockMobile(Request $request, $id)
    {
        $user = $this->resolveMobileUser($request);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $supply = OperationalSupply::where('user_id', $user->getOwnerId())->findOrFail($id);

        $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $oldStock = $supply->stock;
        $newStock = (int) $request->stock;

        $supply->update([
            'stock' => $newStock,
        ]);

        if ($oldStock !== $newStock) {
            $adjustment = $newStock - $oldStock;
            OperationalSupplyLog::create([
                'user_id' => $user->getOwnerId(),
                'operational_supply_id' => $supply->id,
                'operational_supply_name' => $supply->name,
                'adjustment' => $adjustment,
                'source' => 'mobile_quick_update',
                'description' => "Pembaruan cepat stok via Mobile: {$oldStock} -> {$newStock}",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stok bahan operasional berhasil diperbarui.',
            'supply' => $supply
        ]);
    }
}

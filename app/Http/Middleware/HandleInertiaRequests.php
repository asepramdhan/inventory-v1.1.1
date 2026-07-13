<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $notifications = [];

        if ($user) {
            $userId = $user->id;

            // 1. Ambil stok produk menipis (stok <= 10)
            $lowStockProducts = \App\Models\Product::where('user_id', $userId)
                ->where('stock', '<=', 10)
                ->get(['id', 'name', 'sku', 'stock']);

            foreach ($lowStockProducts as $prod) {
                $notifications[] = [
                    'id' => 'prod-' . $prod->id,
                    'type' => 'product',
                    'title' => 'Stok Produk Menipis',
                    'message' => "Stok produk '{$prod->name}' ({$prod->sku}) tersisa {$prod->stock} pcs.",
                    'link' => '/operational/products', // Halaman master produk
                    'severity' => $prod->stock <= 0 ? 'critical' : 'warning',
                ];
            }

            // 2. Ambil stok bahan operasional menipis (stok <= min_stock)
            $lowStockSupplies = \App\Models\OperationalSupply::where('user_id', $userId)
                ->whereRaw('stock <= min_stock')
                ->get(['id', 'name', 'stock', 'min_stock', 'unit']);

            foreach ($lowStockSupplies as $supply) {
                $notifications[] = [
                    'id' => 'supply-' . $supply->id,
                    'type' => 'supply',
                    'title' => 'Stok Bahan Menipis',
                    'message' => "Stok bahan '{$supply->name}' tersisa {$supply->stock} {$supply->unit} (min: {$supply->min_stock} {$supply->unit}).",
                    'link' => '/operational/supplies', // Halaman bahan operasional
                    'severity' => $supply->stock <= 0 ? 'critical' : 'warning',
                ];
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => $notifications,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}

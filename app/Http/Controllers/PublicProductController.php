<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicProductController extends Controller
{
    public function show($code)
    {
        $product = Product::where('landing_code', $code)
            ->where('landing_active', true)
            ->firstOrFail();

        $product->load('category');

        return Inertia::render('public/product-landing', [
            'product' => $product
        ]);
    }
}

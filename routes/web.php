<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::resource('stores', StoreController::class);
    Route::get('/master-data/store/export', [StoreController::class, 'export'])->name('stores.export');
    Route::post('/master-data/store/bulk-delete', [StoreController::class, 'bulkDestroy'])->name('stores.bulk-destroy');
});

require __DIR__ . '/settings.php';

<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductHppController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    // Menu Keuangan & Analisa - Daftar Transaksi
    Route::get('/finance/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::post('/finance/transactions/store', [TransactionController::class, 'store'])->name('transactions.store');
    Route::patch('/finance/transactions/{transaction}/status', [TransactionController::class, 'statusUpdate'])->name('transactions.status-update');
    Route::patch('/finance/transactions/bulk-status', [TransactionController::class, 'bulkStatusUpdate'])->name('transactions.bulk-status');
    Route::post('/finance/transactions/bulk-delete', [TransactionController::class, 'bulkDelete'])->name('transactions.bulk-delete');

    // Menu Master Data
    // Halaman utama daftar HPP & Filter
    Route::get('/master-data/product-hpp', [ProductHppController::class, 'index'])->name('product-hpp.index');
    // Proses simpan data (Satu route untuk create sekaligus update)
    Route::post('/master-data/product-hpp/save', [ProductHppController::class, 'save'])->name('product-hpp.save');
    Route::resource('categories', CategoryController::class);
    Route::get('/master-data/category/export', [CategoryController::class, 'export'])->name('categories.export');
    Route::post('/master-data/category/bulk-delete', [CategoryController::class, 'bulkDestroy'])->name('categories.bulk-destroy');
    Route::resource('products', ProductController::class);
    Route::get('/master-data/product/export', [ProductController::class, 'export'])->name('products.export');
    Route::post('/master-data/product/bulk-delete', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');
    Route::resource('stores', StoreController::class);
    Route::get('/master-data/store/export', [StoreController::class, 'export'])->name('stores.export');
    Route::post('/master-data/store/bulk-delete', [StoreController::class, 'bulkDestroy'])->name('stores.bulk-destroy');
});

require __DIR__ . '/settings.php';

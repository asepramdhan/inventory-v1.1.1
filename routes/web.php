<?php

use App\Http\Controllers\AdsAffiliateController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FinancialMutationController;
use App\Http\Controllers\MarginAnalysisController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\ProducerStockController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductHppController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Menu Keuangan & Analisa - Daftar Transaksi
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Menu Keuangan & Analisa - Daftar Transaksi
    Route::get('/finance/margin-analysis', [MarginAnalysisController::class, 'index'])->name('margin-analysis.index');

    Route::get('/finance/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::post('/finance/transactions/store', [TransactionController::class, 'store'])->name('transactions.store');
    Route::patch('/finance/transactions/{transaction}/status', [TransactionController::class, 'statusUpdate'])->name('transactions.status-update');
    Route::post('/finance/transactions/import-excel', [TransactionController::class, 'importStatusExcel'])->name('transactions.import-excel');
    Route::patch('/finance/transactions/bulk-status', [TransactionController::class, 'bulkStatusUpdate'])->name('transactions.bulk-status');
    Route::post('/finance/transactions/bulk-delete', [TransactionController::class, 'bulkDelete'])->name('transactions.bulk-delete');

    Route::get('/finance/mutations', [FinancialMutationController::class, 'index'])->name('mutations.index');
    Route::post('/finance/mutations', [FinancialMutationController::class, 'store'])->name('mutations.store');
    Route::post('/finance/mutations/accounts', [FinancialMutationController::class, 'storeAccount'])->name('mutations.accounts.store');
    Route::post('/finance/mutations/transfer', [FinancialMutationController::class, 'transfer'])->name('mutations.transfer');
    // Route::patch('/finance/mutations/accounts/{id}', [FinancialMutationController::class, 'updateAccount'])->name('mutations.accounts.update');
    Route::patch('/finance/mutations/accounts/{id}/toggle', [FinancialMutationController::class, 'toggleAccountStatus'])->name('mutations.accounts.toggle');
    Route::patch('/finance/mutations/accounts/{id}/default', [FinancialMutationController::class, 'setDefaultAccount'])->name('mutations.accounts.default');
    Route::delete('/finance/mutations/{id}', [FinancialMutationController::class, 'destroy'])->name('mutations.destroy');

    // Menu Stok & Pemasukan
    Route::get('/operational/producer-stocks', [ProducerStockController::class, 'index'])->name('producer-stocks.index');
    Route::post('/operational/producer-stocks', [ProducerStockController::class, 'store'])->name('producer-stocks.store');
    Route::post('/operational/producer-stocks/{id}/pay', [ProducerStockController::class, 'payInvoice'])->name('producer-stocks.pay');
    Route::get('/operational/producer-stocks/generate-number', [ProducerStockController::class, 'generateInvoiceNumber']);

    Route::resource('products', ProductController::class);
    Route::put('/master-data/product/{product}/update-stock', [ProductController::class, 'updateStock']);
    Route::get('/master-data/product/export', [ProductController::class, 'export'])->name('products.export');
    Route::post('/master-data/product/bulk-delete', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');

    // Menu Master Data
    Route::get('/master-data/producers', [ProducerController::class, 'index'])->name('producers.index');
    Route::post('/master-data/producers', [ProducerController::class, 'store'])->name('producers.store');

    Route::get('/master-data/product-hpp', [ProductHppController::class, 'index'])->name('product-hpp.index');
    Route::post('/master-data/product-hpp/save', [ProductHppController::class, 'save'])->name('product-hpp.save');
    Route::resource('categories', CategoryController::class);
    Route::get('/master-data/category/export', [CategoryController::class, 'export'])->name('categories.export');
    Route::post('/master-data/category/bulk-delete', [CategoryController::class, 'bulkDestroy'])->name('categories.bulk-destroy');
    Route::resource('stores', StoreController::class);
    Route::get('/master-data/store/export', [StoreController::class, 'export'])->name('stores.export');
    Route::post('/master-data/store/bulk-delete', [StoreController::class, 'bulkDestroy'])->name('stores.bulk-destroy');
});

Route::middleware(['auth', 'verified'])->prefix('finance/ads-affiliate')->name('ads-affiliate.')->group(function () {
    Route::get('/', [AdsAffiliateController::class, 'index'])->name('index');
    Route::post('/', [AdsAffiliateController::class, 'store'])->name('store');
    Route::post('/{id}/update', [AdsAffiliateController::class, 'update'])->name('update');
    Route::delete('/{id}', [AdsAffiliateController::class, 'destroy'])->name('destroy');
    Route::post('/bulk-delete', [AdsAffiliateController::class, 'bulkDelete'])->name('bulk-delete');
    Route::get('/export', [AdsAffiliateController::class, 'export'])->name('export');
});

require __DIR__ . '/settings.php';

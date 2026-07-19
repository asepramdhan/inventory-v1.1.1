<?php

use App\Http\Controllers\AdsAffiliateController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\BiteshipController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinancialMutationController;
use App\Http\Controllers\MarginAnalysisController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\ProducerStockController;
use App\Http\Controllers\OperationalSupplyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ProfitLossController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::get('/p/{code}', [\App\Http\Controllers\PublicProductController::class, 'show'])->name('public.product');
Route::post('/api/mobile/login', [TransactionController::class, 'mobileLogin'])->name('api.mobile-login');
Route::get('/api/mobile/stats', [TransactionController::class, 'mobileStats'])->name('api.mobile-stats');
Route::get('/api/mobile/product/scan', [TransactionController::class, 'mobileScanProduct'])->name('api.mobile-product-scan');
Route::post('/api/mobile/product/update-stock', [TransactionController::class, 'mobileUpdateProductStock'])->name('api.mobile-product-update-stock');
Route::post('/finance/transactions/barcode-upload-proof', [TransactionController::class, 'uploadProofByBarcode'])->name('transactions.barcode-upload-proof');

Route::get('/clear-route-cache', function() {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    return 'Laravel cache and routes cleared successfully woy!';
});

Route::get('/view-laravel-log', function() {
    $logPath = storage_path('logs/laravel.log');
    if (!file_exists($logPath)) {
        return 'Log file does not exist woy!';
    }
    // Baca 15000 karakter terakhir
    $size = filesize($logPath);
    $fp = fopen($logPath, 'r');
    if ($size > 15000) {
        fseek($fp, $size - 15000);
    }
    $content = fread($fp, 15000);
    fclose($fp);
    return '<pre style="background:#0f172a;color:#cbd5e1;padding:20px;font-family:monospace;">' . htmlspecialchars($content) . '</pre>';
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Menu Keuangan & Analisa - Daftar Transaksi
    // Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Menu Keuangan & Analisa - Daftar Transaksi
    Route::get('/finance/margin-analysis', [MarginAnalysisController::class, 'index'])->name('margin-analysis.index');

    Route::get('/finance/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/finance/transactions/export', [TransactionController::class, 'export'])->name('transactions.export');
    Route::post('/finance/transactions/store', [TransactionController::class, 'store'])->name('transactions.store');
    Route::patch('/finance/transactions/{transaction}/status', [TransactionController::class, 'statusUpdate'])->name('transactions.status-update');
    Route::post('/finance/transactions/import-excel', [TransactionController::class, 'importStatusExcel'])->name('transactions.import-excel');
    Route::post('/finance/transactions/import-shopee', [TransactionController::class, 'importShopeeOrders'])->name('transactions.import-shopee');
    Route::patch('/finance/transactions/bulk-status', [TransactionController::class, 'bulkStatusUpdate'])->name('transactions.bulk-status');
    Route::post('/finance/transactions/bulk-delete', [TransactionController::class, 'bulkDelete'])->name('transactions.bulk-delete');
    Route::post('/finance/transactions/{transaction}/upload-proof', [TransactionController::class, 'uploadProof'])->name('transactions.upload-proof');
    Route::post('/finance/transactions/{transaction}/delete-proof', [TransactionController::class, 'deleteProof'])->name('transactions.delete-proof');
    Route::get('/finance/transactions/packing-station', [TransactionController::class, 'packingStation'])->name('transactions.packing-station');
    Route::get('/finance/transactions/search-proof', [TransactionController::class, 'searchProof'])->name('transactions.search-proof');

    Route::get('/finance/mutations', [FinancialMutationController::class, 'index'])->name('mutations.index');
    Route::post('/finance/mutations', [FinancialMutationController::class, 'store'])->name('mutations.store');
    Route::post('/finance/mutations/accounts', [FinancialMutationController::class, 'storeAccount'])->name('mutations.accounts.store');
    Route::post('/finance/mutations/transfer', [FinancialMutationController::class, 'transfer'])->name('mutations.transfer');
    Route::patch('/finance/mutations/accounts/{id}', [FinancialMutationController::class, 'updateAccount'])->name('mutations.accounts.update');
    Route::patch('/finance/mutations/accounts/{id}/toggle', [FinancialMutationController::class, 'toggleAccountStatus'])->name('mutations.accounts.toggle');
    Route::patch('/finance/mutations/accounts/{id}/default', [FinancialMutationController::class, 'setDefaultAccount'])->name('mutations.accounts.default');
    Route::delete('/finance/mutations/{id}', [FinancialMutationController::class, 'destroy'])->name('mutations.destroy');

    // Menu Keuangan - Laporan Laba Rugi
    Route::get('/finance/profit-loss', [ProfitLossController::class, 'index'])->name('profit-loss.index');
    Route::get('/finance/profit-loss/export', [ProfitLossController::class, 'exportExcel'])->name('profit-loss.export');

    // Menu Stok & Pemasukan (Operational)
    Route::get('/operational/producer-stocks', [ProducerStockController::class, 'index'])->name('producer-stocks.index');
    Route::post('/operational/producer-stocks', [ProducerStockController::class, 'store'])->name('producer-stocks.store');
    Route::post('/operational/producer-stocks/{id}/pay', [ProducerStockController::class, 'payInvoice'])->name('producer-stocks.pay');
    Route::get('/operational/producer-stocks/generate-number', [ProducerStockController::class, 'generateInvoiceNumber']);
    Route::put('/operational/producer-stocks/{id}/update-note', [ProducerStockController::class, 'updateNote']);

    Route::resource('operational/products', ProductController::class)->names('products');
    Route::put('/operational/product/{product}/update-stock', [ProductController::class, 'updateStock']);
    Route::get('/operational/product/export', [ProductController::class, 'export'])->name('products.export');
    Route::post('/operational/product/bulk-delete', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');
    Route::post('/operational/product-hpp/save', [ProductController::class, 'saveHpp'])->name('product-hpp.save');
    Route::get('/operational/product-hpp/export', [ProductController::class, 'exportHpp'])->name('product-hpp.export');

    Route::get('/operational/supplies', [OperationalSupplyController::class, 'index'])->name('supplies.index');
    Route::post('/operational/supplies', [OperationalSupplyController::class, 'store'])->name('supplies.store');
    Route::put('/operational/supplies/{id}', [OperationalSupplyController::class, 'update'])->name('supplies.update');
    Route::delete('/operational/supplies/{id}', [OperationalSupplyController::class, 'destroy'])->name('supplies.destroy');
    Route::put('/operational/supplies/{id}/update-stock', [OperationalSupplyController::class, 'updateStock'])->name('supplies.update-stock');

    // Menu Master Data
    Route::get('/master-data/producers', [ProducerController::class, 'index'])->name('producers.index');
    Route::post('/master-data/producers', [ProducerController::class, 'store'])->name('producers.store');
    Route::put('/master-data/producers/{id}', [ProducerController::class, 'update'])->name('producers.update');
    Route::delete('/master-data/producers/{id}', [ProducerController::class, 'destroy'])->name('producers.destroy');

    Route::resource('master-data/categories', CategoryController::class)->names('categories');
    Route::get('/master-data/category/export', [CategoryController::class, 'export'])->name('categories.export');
    Route::post('/master-data/category/bulk-delete', [CategoryController::class, 'bulkDestroy'])->name('categories.bulk-destroy');
    Route::resource('master-data/stores', StoreController::class)->names('stores');
    Route::get('/master-data/store/export', [StoreController::class, 'export'])->name('stores.export');
    Route::post('/master-data/store/bulk-delete', [StoreController::class, 'bulkDestroy'])->name('stores.bulk-destroy');
    Route::resource('master-data/customers', CustomerController::class)->names('customers');

    // Biteship API Routes
    Route::get('/api/biteship/search-areas', [BiteshipController::class, 'searchAreas'])->name('biteship.search-areas');
    Route::post('/api/biteship/rates', [BiteshipController::class, 'getRates'])->name('biteship.rates');
    Route::post('/api/biteship/transactions/{id}/book', [BiteshipController::class, 'bookShipment'])->name('biteship.book-shipment');
    Route::get('/api/biteship/transactions/{id}/track', [BiteshipController::class, 'trackShipment'])->name('biteship.track-shipment');

    // Menu Backup & Restore Database
    Route::get('/master-data/backups', [BackupController::class, 'index'])->name('backups.index');
    Route::post('/master-data/backups/create', [BackupController::class, 'create'])->name('backups.create');
    Route::get('/master-data/backups/{filename}/download', [BackupController::class, 'download'])->name('backups.download');
    Route::post('/master-data/backups/{filename}/restore', [BackupController::class, 'restore'])->name('backups.restore');
    Route::post('/master-data/backups/upload-restore', [BackupController::class, 'uploadAndRestore'])->name('backups.upload-restore');
    Route::delete('/master-data/backups/{filename}', [BackupController::class, 'destroy'])->name('backups.destroy');
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

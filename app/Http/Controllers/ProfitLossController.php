<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfitLossController extends Controller
{
    /**
     * Helper to get consolidated Profit & Loss statement data
     */
    private function getProfitLossData($userId, $month, $year)
    {
        $userStoreIds = DB::table('stores')->where('user_id', $userId)->pluck('id')->toArray();
        $monthStr = str_pad($month, 2, '0', STR_PAD_LEFT);
        $timezone = 'Asia/Jakarta';

        // Build date bounds
        $startDate = Carbon::createFromDate($year, $monthStr, 1, $timezone)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $monthStr, 1, $timezone)->endOfMonth();

        $startDateStr = $startDate->format('Y-m-d 00:00:00');
        $endDateStr = $endDate->format('Y-m-d 23:59:59');

        $startDateDayStr = $startDate->format('Y-m-d');
        $endDateDayStr = $endDate->format('Y-m-d');

        // =====================================================================
        // A. PENDAPATAN (REVENUES)
        // =====================================================================

        // 1. Penjualan Kotor (Gross Sales) & Diskon (Discounts) dari Transaksi Aktif
        $salesSummary = DB::table('transactions')
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('transaction_date', [$startDateStr, $endDateStr])
            ->where('status', '!=', 'cancelled')
            ->selectRaw('
                COALESCE(SUM(subtotal), 0) as gross_sales,
                COALESCE(SUM(discount), 0) as total_discount,
                COALESCE(SUM(affiliate_fee), 0) as total_affiliate_order,
                COALESCE(SUM(marketplace_admin_fee), 0) as total_admin_fee
            ')
            ->first();

        $grossSales = (float) $salesSummary->gross_sales;
        $totalDiscount = (float) $salesSummary->total_discount;
        $netSales = $grossSales - $totalDiscount;

        // 2. Pendapatan Non-Penjualan Lainnya dari Mutasi Kas
        $excludeIncomeCategories = ['Transfer Masuk', 'Omzet Penjualan', 'Penjualan', 'Pemasukan Transaksi', 'Modal Masuk'];
        $otherIncomesList = DB::table('financial_mutations')
            ->where('user_id', $userId)
            ->where('type', 'income')
            ->whereBetween('date', [$startDateDayStr, $endDateDayStr])
            ->whereNotIn('category', $excludeIncomeCategories)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total' => (float) $item->total
                ];
            });

        $totalOtherIncome = $otherIncomesList->sum('total');
        $totalRevenue = $netSales + $totalOtherIncome;

        // =====================================================================
        // B. HARGA POKOK PENJUALAN (COGS / HPP)
        // =====================================================================
        $cogsSummary = DB::table('transaction_items')
            ->join('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
            ->whereIn('transactions.store_id', $userStoreIds)
            ->whereBetween('transactions.transaction_date', [$startDateStr, $endDateStr])
            ->where('transactions.status', '!=', 'cancelled')
            ->selectRaw('COALESCE(SUM(transaction_items.total_hpp_snapshot * transaction_items.quantity), 0) as total_cogs')
            ->first();

        $totalCogs = (float) $cogsSummary->total_cogs;
        $grossProfit = $netSales - $totalCogs;

        // =====================================================================
        // C. BEBAN OPERASIONAL & PENJUALAN (EXPENSES)
        // =====================================================================

        // 1. Biaya Iklan (dari logs harian toko)
        $totalAds = (float) DB::table('store_daily_ads')
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startDateDayStr, $endDateDayStr])
            ->sum('amount_spent');

        // 2. Biaya Affiliate (dari pesanan + harian manual)
        $totalAffiliateOrder = (float) $salesSummary->total_affiliate_order;
        $totalAffiliateManual = (float) DB::table('store_daily_ads')
            ->whereIn('store_id', $userStoreIds)
            ->whereBetween('date', [$startDateDayStr, $endDateDayStr])
            ->sum('affiliate_fee');
        $totalAffiliate = $totalAffiliateOrder + $totalAffiliateManual;

        // 3. Biaya Admin Marketplace
        $totalAdminFee = (float) $salesSummary->total_admin_fee;

        // 4. Beban Bahan Operasional (diambil dari log bahan operasional yang berkurang / terpakai)
        $suppliesExpense = DB::table('operational_supply_logs')
            ->join('operational_supplies', 'operational_supply_logs.operational_supply_id', '=', 'operational_supplies.id')
            ->where('operational_supply_logs.user_id', $userId)
            ->where('operational_supply_logs.adjustment', '<', 0)
            ->whereBetween('operational_supply_logs.created_at', [$startDateStr, $endDateStr])
            ->selectRaw('COALESCE(SUM(operational_supplies.purchase_price * ABS(operational_supply_logs.adjustment)), 0) as total')
            ->first();

        $totalSupplies = (float) $suppliesExpense->total;

        // 5. Beban Lainnya (diambil dari mutasi kas pengeluaran manual, mengecualikan transfer/tarik tunai/pelunasan supplier)
        $excludeExpenseCategories = ['Tarik Tunai', 'Transfer Keluar', 'Tarik Saldo', 'Transfer Masuk', 'Pelunasan Produsen', 'Pelunasan Hutang', 'Pembelian Bahan Operasional'];
        $otherExpensesList = DB::table('financial_mutations')
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->whereBetween('date', [$startDateDayStr, $endDateDayStr])
            ->whereNotIn('category', $excludeExpenseCategories)
            ->where('category', 'not like', '%iklan%')
            ->where('category', 'not like', '%affiliate%')
            ->where('category', 'not like', '%pelunasan%')
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total' => (float) $item->total
                ];
            });

        $totalOtherExpense = $otherExpensesList->sum('total');
        $totalExpenses = $totalAds + $totalAffiliate + $totalAdminFee + $totalSupplies + $totalOtherExpense;

        // =====================================================================
        // D. LABA BERSIH (NET PROFIT)
        // =====================================================================
        $netProfit = $grossProfit - $totalExpenses + $totalOtherIncome;

        return [
            'gross_sales' => $grossSales,
            'total_discount' => $totalDiscount,
            'net_sales' => $netSales,
            'other_incomes' => $otherIncomesList,
            'total_other_income' => $totalOtherIncome,
            'total_revenue' => $totalRevenue,
            'total_cogs' => $totalCogs,
            'gross_profit' => $grossProfit,
            'total_ads' => $totalAds,
            'total_affiliate' => $totalAffiliate,
            'total_admin_fee' => $totalAdminFee,
            'total_supplies' => $totalSupplies,
            'other_expenses' => $otherExpensesList,
            'total_other_expense' => $totalOtherExpense,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
        ];
    }

    /**
     * Display the monthly Profit & Loss Statement
     */
    public function index(Request $request)
    {
        $userId = Auth::user()->getOwnerId();
        $userStoreIds = DB::table('stores')->where('user_id', $userId)->pluck('id')->toArray();

        // 1. Resolve month & year query filters
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));

        $data = $this->getProfitLossData($userId, $month, $year);

        // =====================================================================
        // E. LIST DYNAMIC YEARS FILTER FOR SELECT DROPDOWN
        // =====================================================================
        $transactionYears = DB::table('transactions')
            ->whereIn('store_id', $userStoreIds)
            ->selectRaw('YEAR(transaction_date) as year')
            ->pluck('year')
            ->toArray();
        
        $mutationYears = DB::table('financial_mutations')
            ->where('user_id', $userId)
            ->selectRaw('YEAR(date) as year')
            ->pluck('year')
            ->toArray();

        $years = collect(array_merge($transactionYears, $mutationYears))
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        if (empty($years)) {
            $years = [(int) date('Y')];
        }

        return Inertia::render('finance/profit-loss', [
            'data' => $data,
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'available_years' => $years
            ]
        ]);
    }

    /**
     * Export the monthly Profit & Loss Statement to Excel format
     */
    public function exportExcel(Request $request)
    {
        $userId = Auth::user()->getOwnerId();
        $month = $request->input('month', date('m'));
        $year = $request->input('year', date('Y'));
        $monthStr = str_pad($month, 2, '0', STR_PAD_LEFT);

        $data = $this->getProfitLossData($userId, $month, $year);

        // 1. Initialize Spreadsheet
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 2. Set Sheet Name & General Style
        $sheet->setTitle('Laporan Laba Rugi');
        
        // Define Month names in Indonesia
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $monthName = $monthNames[(int)$month] ?? 'Bulan';

        // 3. Write Headers
        $sheet->mergeCells('A1:C1');
        $sheet->setCellValue('A1', 'LAPORAN LABA RUGI');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:C2');
        $sheet->setCellValue('A2', 'Periode: ' . $monthName . ' ' . $year);
        $sheet->getStyle('A2')->getFont()->setSize(11)->setItalic(true);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

        // Header Table Columns (Row 4)
        $sheet->setCellValue('A4', 'Keterangan Akun');
        $sheet->setCellValue('B4', 'Nominal (Rupiah)');
        $sheet->setCellValue('C4', 'Persentase terhadap Omzet (%)');
        
        $headerStyle = $sheet->getStyle('A4:C4');
        $headerStyle->getFont()->setBold(true);
        $headerStyle->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFF0F0F0');
        $headerStyle->getBorders()->getBottom()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_MEDIUM);

        // Setup dynamic list rows
        $row = 5;

        // Group I: PENDAPATAN
        $sheet->setCellValue('A' . $row, 'I. PENDAPATAN USAHA (REVENUE)');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        // Helper to add a detail row
        $writeRow = function($label, $amount, $percentOf, $isSubTotal = false) use (&$row, $sheet) {
            $sheet->setCellValue('A' . $row, $label);
            $sheet->setCellValue('B' . $row, $amount);
            
            // Calculate percentage
            $percentage = $percentOf > 0 ? ($amount / $percentOf) : 0;
            $sheet->setCellValue('C' . $row, $percentage);

            // Format numbers
            $sheet->getStyle('B' . $row)->getNumberFormat()->setFormatCode('"Rp"#,##0;("-Rp"#,##0);"-"');
            $sheet->getStyle('C' . $row)->getNumberFormat()->setFormatCode('0.0%');

            if ($isSubTotal) {
                $sheet->getStyle('A' . $row . ':C' . $row)->getFont()->setBold(true);
                $sheet->getStyle('A' . $row . ':C' . $row)->getBorders()->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                $sheet->getStyle('A' . $row . ':C' . $row)->getBorders()->getBottom()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
            } else {
                $sheet->getStyle('A' . $row)->getAlignment()->setIndent(2);
            }
            $row++;
        };

        // 1. Gross sales
        $writeRow('Pendapatan Penjualan Toko (Gross)', $data['gross_sales'], $data['net_sales']);
        
        // 2. Discounts (negative value display)
        $sheet->setCellValue('A' . $row, 'Potongan Harga / Diskon Penjualan (-)');
        $sheet->setCellValue('B' . $row, -$data['total_discount']);
        $percentageDiscount = $data['net_sales'] > 0 ? (-$data['total_discount'] / $data['net_sales']) : 0;
        $sheet->setCellValue('C' . $row, $percentageDiscount);
        $sheet->getStyle('B' . $row)->getNumberFormat()->setFormatCode('"Rp"#,##0;("-Rp"#,##0);"-"');
        $sheet->getStyle('C' . $row)->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle('A' . $row)->getAlignment()->setIndent(2);
        $row++;

        // 3. Net Sales
        $writeRow('Total Pendapatan Bersih Penjualan (A)', $data['net_sales'], $data['net_sales'], true);

        // 4. Other Incomes list
        if (count($data['other_incomes']) > 0) {
            $sheet->setCellValue('A' . $row, '  Pendapatan Non-Operasional Lainnya:');
            $sheet->getStyle('A' . $row)->getFont()->setItalic(true);
            $row++;
            foreach ($data['other_incomes'] as $inc) {
                $writeRow('  ' . $inc['category'], $inc['total'], $data['net_sales']);
            }
            $writeRow('  Total Pendapatan Non-Penjualan Lainnya', $data['total_other_income'], $data['net_sales'], true);
        }

        // 5. Total revenue (Revenue + Other income)
        $writeRow('TOTAL PENDAPATAN USAHA AKHIR (A + B)', $data['total_revenue'], $data['net_sales'], true);
        $sheet->getStyle('A' . ($row - 1) . ':C' . ($row - 1))->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFF9F9F9');
        $row++;

        // Group II: HPP
        $sheet->setCellValue('A' . $row, 'II. HARGA POKOK PENJUALAN (COGS)');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        // COGS (negative display)
        $sheet->setCellValue('A' . $row, 'Biaya Pokok / HPP Barang Terjual (-)');
        $sheet->setCellValue('B' . $row, -$data['total_cogs']);
        $percentageCogs = $data['net_sales'] > 0 ? (-$data['total_cogs'] / $data['net_sales']) : 0;
        $sheet->setCellValue('C' . $row, $percentageCogs);
        $sheet->getStyle('B' . $row)->getNumberFormat()->setFormatCode('"Rp"#,##0;("-Rp"#,##0);"-"');
        $sheet->getStyle('C' . $row)->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle('A' . $row)->getAlignment()->setIndent(2);
        $row++;

        // Laba Kotor (Gross Profit)
        $writeRow('TOTAL LABA KOTOR PENJUALAN (A - HPP)', $data['gross_profit'], $data['net_sales'], true);
        $sheet->getStyle('A' . ($row - 1) . ':C' . ($row - 1))->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFF9F9F9');
        $row++;

        // Group III: OPERATING EXPENSES
        $sheet->setCellValue('A' . $row, 'III. BEBAN OPERASIONAL & PENJUALAN (EXPENSES)');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        // Details expenses
        $writeRow('Beban Iklan Toko (Ads Spend)', $data['total_ads'], $data['net_sales']);
        $writeRow('Beban Affiliate Fee (E-Commerce)', $data['total_affiliate'], $data['net_sales']);
        $writeRow('Biaya Administrasi Marketplace (E-Commerce)', $data['total_admin_fee'], $data['net_sales']);
        $writeRow('Beban Pemakaian Bahan Operasional (Packing/Plastik)', $data['total_supplies'], $data['net_sales']);

        if (count($data['other_expenses']) > 0) {
            $sheet->setCellValue('A' . $row, '  Beban Pengeluaran Kas Operasional:');
            $sheet->getStyle('A' . $row)->getFont()->setItalic(true);
            $row++;
            foreach ($data['other_expenses'] as $exp) {
                $writeRow('  ' . $exp['category'], $exp['total'], $data['net_sales']);
            }
            $writeRow('  Total Pengeluaran Kas Lainnya', $data['total_other_expense'], $data['net_sales'], true);
        }

        // Total Expenses
        $sheet->setCellValue('A' . $row, 'TOTAL BEBAN USAHA OPERASIONAL (E)');
        $sheet->setCellValue('B' . $row, -$data['total_expenses']);
        $percentageExpenses = $data['net_sales'] > 0 ? (-$data['total_expenses'] / $data['net_sales']) : 0;
        $sheet->setCellValue('C' . $row, $percentageExpenses);
        $sheet->getStyle('B' . $row)->getNumberFormat()->setFormatCode('"Rp"#,##0;("-Rp"#,##0);"-"');
        $sheet->getStyle('C' . $row)->getNumberFormat()->setFormatCode('0.0%');
        $sheet->getStyle('A' . $row . ':C' . $row)->getFont()->setBold(true);
        $sheet->getStyle('A' . $row . ':C' . $row)->getBorders()->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        $sheet->getStyle('A' . $row . ':C' . $row)->getBorders()->getBottom()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        $sheet->getStyle('A' . $row . ':C' . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFEEEE');
        $row++;
        $row++;

        // Group IV: NET PROFIT
        $sheet->setCellValue('A' . $row, 'IV. LABA / RUGI BERSIH AKHIR (A - HPP - E)');
        $sheet->setCellValue('B' . $row, $data['net_profit']);
        $percentageNetProfit = $data['net_sales'] > 0 ? ($data['net_profit'] / $data['net_sales']) : 0;
        $sheet->setCellValue('C' . $row, $percentageNetProfit);
        
        $sheet->getStyle('B' . $row)->getNumberFormat()->setFormatCode('"Rp"#,##0;("-Rp"#,##0);"-"');
        $sheet->getStyle('C' . $row)->getNumberFormat()->setFormatCode('0.0%');

        // Style the Net profit row (grand total standard double borders)
        $sheet->getStyle('A' . $row . ':C' . $row)->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A' . $row . ':C' . $row)->getBorders()->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        $sheet->getStyle('A' . $row . ':C' . $row)->getBorders()->getBottom()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_DOUBLE);
        
        // Color green if positive, red if negative
        if ($data['net_profit'] >= 0) {
            $sheet->getStyle('A' . $row . ':C' . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFE8F5E9');
        } else {
            $sheet->getStyle('A' . $row . ':C' . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFEBEE');
        }
        $row++;

        // Auto size columns
        foreach (range('A', 'C') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Stream file
        $fileName = 'Laporan_Laba_Rugi_' . $year . '_' . $monthStr . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        
        $response = new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        });

        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        $response->headers->set('Cache-Control', 'max-age=0');

        return $response;
    }
}

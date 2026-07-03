<?php

namespace App\Http\Controllers;

use App\Models\FinancialAccount;
use App\Models\FinancialMutation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinancialMutationController extends Controller
{
    public function index(Request $request)
    {
        $userId = Auth::user()->id;

        // 1. Ambil Semua Daftar Akun Keuangan Milik User (untuk dropdown form & widget saldo)
        $accounts = FinancialAccount::where('user_id', $userId)->get();

        // 2. Filter & Ambil Data Mutasi
        $accountId = $request->input('financial_account_id', 'all');
        $type = $request->input('type', 'all');
        $search = $request->input('search');

        $timezone = 'Asia/Jakarta';
        $startDate = $request->input('start_date', Carbon::now($timezone)->subDays(30)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now($timezone)->format('Y-m-d'));

        $mutations = FinancialMutation::with('account')
            ->where('user_id', $userId)
            ->whereBetween('date', [$startDate, $endDate])
            ->when($accountId !== 'all', function ($query) use ($accountId) {
                return $query->where('financial_account_id', $accountId);
            })
            ->when($type !== 'all', function ($query) use ($type) {
                return $query->where('type', $type);
            })
            ->when($search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('category', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%");
                });
            })
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        // 3. Hitung Total Uang Masuk & Keluar dari data yang terfilter untuk ditaruh di Card Ringkasan
        $totalIncome = $mutations->where('type', 'income')->sum('amount');
        $totalExpense = $mutations->where('type', 'expense')->sum('amount');

        return Inertia::render('finance/mutations', [
            'accounts' => $accounts,
            'mutations' => $mutations,
            'summary' => [
                'total_income' => (float)$totalIncome,
                'total_expense' => (float)$totalExpense,
                'net_cash_flow' => (float)($totalIncome - $totalExpense)
            ],
            'filters' => [
                'financial_account_id' => $accountId,
                'type' => $type,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'search' => $search
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'financial_account_id' => 'required|exists:financial_accounts,id',
            'date' => 'required|date',
            'type' => 'required|in:income,expense',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'reference_number' => 'nullable|string|max:255',
            'description' => 'nullable|string'
        ]);

        $userId = Auth::user()->id;

        // Ambil data akun keuangan & pastikan milik user yang login
        $account = FinancialAccount::where('id', $request->financial_account_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        DB::transaction(function () use ($request, $userId, $account) {
            $amount = $request->amount;

            // Update Saldo Terkini di Akun Kas Utama
            if ($request->type === 'income') {
                $account->current_balance += $amount;
            } else {
                $account->current_balance -= $amount;
            }
            $account->save();

            // Simpan Log Mutasi berserta Snapshot Saldo Terakhirnya
            FinancialMutation::create([
                'user_id' => $userId,
                'financial_account_id' => $account->id,
                'date' => $request->date,
                'type' => $request->type,
                'category' => $request->category,
                'amount' => $amount,
                'balance_snapshot' => $account->current_balance, // Menyimpan historis sisa saldo
                'reference_number' => $request->reference_number,
                'description' => $request->description
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Mutasi keuangan berhasil dicatat.']);

        return back();
    }
}

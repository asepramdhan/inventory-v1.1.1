<?php

namespace App\Http\Controllers;

use App\Models\FinancialAccount;
use App\Models\FinancialMutation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

        // --- PROTEKSI SALDO NEGATIF (SAAT INPUT) ---
        if ($request->type === 'expense' && $account->current_balance < $request->amount) {
            // Inertia::flash('error', 'Saldo tidak mencukupi! Saldo terkini di ' . $account->name . ' hanya Rp ' . number_format($account->current_balance, 0, ',', '.'));
            throw ValidationException::withMessages([
                'amount' => 'Saldo tidak cukup! Saldo ' . $account->name . ' saat ini Rp ' . number_format($account->current_balance, 0, ',', '.')
            ]);
        }

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

    public function storeAccount(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:bank,e-wallet,cash',
            'current_balance' => 'required|numeric|min:0',
            'description' => 'nullable|string'
        ]);

        \App\Models\FinancialAccount::create([
            'user_id' => Auth::user()->id,
            'name' => $request->name,
            'type' => $request->type,
            'current_balance' => $request->current_balance,
            'description' => $request->description,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun kas baru berhasil didaftarkan.']);

        return back();
    }

    // 1. Fungsi Edit Nama & Deskripsi Akun Kas
    public function updateAccount(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $account = FinancialAccount::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $account->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Informasi akun kas berhasil diperbarui.']);

        return back();
    }

    // 2. Fungsi Aktif/Nonaktifkan Akun Kas (Arsip pengganti Hapus)
    public function toggleAccountStatus($id)
    {
        $account = FinancialAccount::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Cegah menonaktifkan jika akun ini adalah akun default
        if ($account->is_default && $account->is_active) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal! Ubah status default akun ini terlebih dahulu sebelum dinonaktifkan.']);

            return back();
        }

        $account->is_active = !$account->is_active;
        $account->save();

        $statusText = $account->is_active ? 'diaktifkan kembali.' : 'berhasil dinonaktifkan (diarsipkan).';

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status akun kas berhasil ' . $statusText]);

        return back();
    }

    // 3. Fungsi Menjadikan Akun Ini Sebagai Default Pencairan Transaksi
    public function setDefaultAccount($id)
    {
        $userId = Auth::id();

        DB::transaction(function () use ($id, $userId) {
            // Matikan status default akun lain milik user ini
            FinancialAccount::where('user_id', $userId)->update(['is_default' => false]);

            // Set akun terpilih menjadi default
            $account = FinancialAccount::where('id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();

            $account->is_default = true;
            $account->is_active = true; // Otomatis aktif jika jadi default
            $account->save();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun kas utama pencairan berhasil diubah.']);

        return back();
    }

    public function destroy($id)
    {
        $userId = Auth::user()->id;

        // 1. Cari data mutasi dan pastikan milik user yang sedang login
        $mutation = FinancialMutation::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // 2. Cari akun kas yang terkait dengan mutasi tersebut
        $account = FinancialAccount::where('id', $mutation->financial_account_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // --- PROTEKSI SALDO NEGATIF (SAAT HAPUS UANG MASUK) ---
        // Jika mutasi yang dihapus adalah uang masuk, maka saldo kas saat ini akan berkurang.
        // Kita harus cegah jika pengurangan tersebut membuat kas di bawah 0.
        if ($mutation->type === 'income' && $account->current_balance < $mutation->amount) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal menghapus! Pembatalan uang masuk ini akan menyebabkan saldo ' . $account->name . ' menjadi minus.']);

            return back();
        }

        // 3. Jalankan Database Transaction untuk keamanan data ganda
        DB::transaction(function () use ($mutation, $account) {

            // SISTEM REVERSAL: Balikkan efek saldo kas
            if ($mutation->type === 'income') {
                // Jika dulunya Uang Masuk, maka pembatalan akan MENGURANGI saldo kas
                $account->current_balance -= $mutation->amount;
            } else {
                // Jika dulunya Uang Keluar, maka pembatalan akan MENAMBAHKAN KEMBALI saldo kas
                $account->current_balance += $mutation->amount;
            }

            // Simpan perubahan saldo terbaru pada akun kas
            $account->save();

            // Hapus log mutasi dari database
            $mutation->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Mutasi keuangan berhasil dihapus.']);

        return back();
    }
}

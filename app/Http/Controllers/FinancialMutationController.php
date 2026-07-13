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

        // 2. Buat Base Query Filter (Jangan langsung dieksekusi dulu dengan ->get atau ->paginate)
        $accountId = $request->input('financial_account_id', 'all');
        $type = $request->input('type', 'all');
        $search = $request->input('search');

        $timezone = 'Asia/Jakarta';
        $startDate = $request->input('start_date', Carbon::now($timezone)->subDays(30)->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now($timezone)->format('Y-m-d'));

        $query = FinancialMutation::with('account')
            ->where('user_id', $userId)
            ->whereBetween('date', [$startDate, $endDate])
            ->when($accountId !== 'all', function ($q) use ($accountId) {
                return $q->where('financial_account_id', $accountId);
            })
            ->when($type !== 'all', function ($q) use ($type) {
                return $q->where('type', $type);
            })
            ->when($search, function ($q, $search) {
                return $q->where(function ($sub) use ($search) {
                    $sub->where('category', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('reference_number', 'like', "%{$search}%");
                });
            });

        // 3. Hitung Total Uang Masuk & Keluar dari SELURUH data yang lolos filter (Akurat lintas halaman)
        $totalIncome = (clone $query)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $query)->where('type', 'expense')->sum('amount');
        $totalWithdrawal = (clone $query)
            ->where('type', 'expense')
            ->where(function ($q) {
                $q->where('category', 'Tarik Tunai')
                  ->orWhere('category', 'like', '%tarik%')
                  ->orWhere('category', 'like', '%tarik tunai%')
                  ->orWhere('description', 'like', '%tarik tunai%');
            })
            ->sum('amount');

        // 4. Hitung jumlah mutasi per type untuk badge tabs
        $typeCounts = FinancialMutation::where('user_id', $userId)
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $todayStr = Carbon::now($timezone)->format('Y-m-d');
        $startOfMonth = Carbon::now($timezone)->startOfMonth()->format('Y-m-d');
        $endOfMonth = Carbon::now($timezone)->endOfMonth()->format('Y-m-d');

        $excludeCategories = ['Tarik Tunai', 'Transfer Keluar', 'Tarik Saldo', 'Transfer Masuk', 'Pelunasan Produsen'];

        $todayPersonalExpense = FinancialMutation::where('user_id', $userId)
            ->where('type', 'expense')
            ->where('date', $todayStr)
            ->whereNotIn('category', $excludeCategories)
            ->where('category', 'not like', '%tarik%')
            ->where('category', 'not like', '%transfer%')
            ->where('category', 'not like', '%iklan%')
            ->where('category', 'not like', '%affiliate%')
            ->where('category', 'not like', '%pelunasan%')
            ->sum('amount');

        $monthPersonalExpense = FinancialMutation::where('user_id', $userId)
            ->where('type', 'expense')
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->whereNotIn('category', $excludeCategories)
            ->where('category', 'not like', '%tarik%')
            ->where('category', 'not like', '%transfer%')
            ->where('category', 'not like', '%iklan%')
            ->where('category', 'not like', '%affiliate%')
            ->where('category', 'not like', '%pelunasan%')
            ->sum('amount');

        // 5. Eksekusi data mutasi dengan Pagination (50 data per halaman)
        $mutations = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(50)
            ->withQueryString(); // Memastikan filter tanggal & pencarian tidak hilang saat klik tombol Next/Prev

        return Inertia::render('finance/mutations', [
            'accounts' => $accounts,
            'mutations' => $mutations,
            'summary' => [
                'total_income' => (float)$totalIncome,
                'total_expense' => (float)$totalExpense,
                'total_withdrawal' => (float)$totalWithdrawal,
                'net_cash_flow' => (float)($totalIncome - $totalExpense),
                'today_personal_expense' => (float)$todayPersonalExpense,
                'month_personal_expense' => (float)$monthPersonalExpense,
            ],
            'typeCounts' => [
                'all' => FinancialMutation::where('user_id', $userId)->whereBetween('date', [$startDate, $endDate])->count(),
                'income' => $typeCounts['income'] ?? 0,
                'expense' => $typeCounts['expense'] ?? 0,
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

    public function transfer(Request $request)
    {
        $request->validate([
            'from_account_id' => 'required|exists:financial_accounts,id',
            'to_account_id' => 'required|exists:financial_accounts,id|different:from_account_id',
            'amount' => 'required|numeric|min:1',
            'date' => 'required|date',
            'description' => 'nullable|string'
        ]);

        $userId = Auth::user()->id;

        // 1. Ambil akun asal (Sumber Dana)
        $fromAccount = FinancialAccount::where('id', $request->from_account_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // 2. Ambil akun tujuan (Rekening Bank Penerima)
        $toAccount = FinancialAccount::where('id', $request->to_account_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Proteksi: Pastikan saldo akun asal cukup untuk ditarik
        if ($fromAccount->current_balance < $request->amount) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'amount' => 'Saldo di ' . $fromAccount->name . ' tidak mencukupi untuk melakukan penarikan!'
            ]);
        }

        DB::transaction(function () use ($request, $userId, $fromAccount, $toAccount) {
            $amount = $request->amount;
            $date = $request->date;
            $userDesc = $request->description ? ' (' . $request->description . ')' : '';

            // --- PROSES AKUN ASAL (POTONG SALDO) ---
            $fromAccount->current_balance -= $amount;
            $fromAccount->save();

            // Kode Referensi Unik Transfer Internal
            $refNumber = 'TRF-' . $userId . '-' . date('YmdHis');

            FinancialMutation::create([
                'user_id' => $userId,
                'financial_account_id' => $fromAccount->id,
                'date' => $date,
                'type' => 'expense',
                'category' => 'Transfer Keluar',
                'amount' => $amount,
                'balance_snapshot' => $fromAccount->current_balance,
                'reference_number' => $refNumber,
                'description' => 'Penarikan saldo ke ' . $toAccount->name . $userDesc
            ]);

            // --- PROSES AKUN TUJUAN (TAMBAH SALDO) ---
            $toAccount->current_balance += $amount;
            $toAccount->save();

            FinancialMutation::create([
                'user_id' => $userId,
                'financial_account_id' => $toAccount->id,
                'date' => $date,
                'type' => 'income',
                'category' => 'Transfer Masuk',
                'amount' => $amount,
                'balance_snapshot' => $toAccount->current_balance,
                'reference_number' => $refNumber,
                'description' => 'Penerimaan dana dari ' . $fromAccount->name . $userDesc
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Penarikan saldo berhasil diproses dan mutasi tercatat!']);

        return back();
    }

    public function destroy($id)
    {
        $userId = Auth::user()->id;

        // 1. Cari data mutasi dan pastikan milik user yang sedang login
        $mutation = FinancialMutation::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        // --- PROTEKSI PINTAR BACKEND: Cek kolom reference_number ---
        if (!empty($mutation->reference_number)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Gagal! Mutasi otomatis yang terikat dengan nomor referensi/nota (' . $mutation->reference_number . ') tidak boleh dihapus dari sini.'
            ]);
            return back();
        }
        // ----------------------------------------------------------

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

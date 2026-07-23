<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('parent_id', Auth::id())
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'email', 'role', 'permissions', 'created_at']);

        return Inertia::render('master-data/users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:admin,staff',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:transactions,scanner,products,supplies,expenses,customers',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'parent_id' => Auth::id(),
            'permissions' => $request->role === 'staff' ? ($request->permissions ?? []) : null,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $user = User::where('id', $id)->where('parent_id', Auth::id())->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|in:admin,staff',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:transactions,scanner,products,supplies,expenses,customers',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->permissions = $request->role === 'staff' ? ($request->permissions ?? []) : null;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return redirect()->back();
    }

    public function destroy($id)
    {
        if (Auth::id() == $id) {
            abort(400, 'Anda tidak bisa menghapus akun Anda sendiri.');
        }

        $user = User::where('id', $id)->where('parent_id', Auth::id())->firstOrFail();
        $user->delete();

        return redirect()->back();
    }

    public function mobileIndex(Request $request)
    {
        $user = $this->resolveMobileUser($request);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $users = User::where('parent_id', $user->id)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'email', 'role', 'permissions', 'created_at']);

        return response()->json([
            'success' => true,
            'users' => $users
        ]);
    }

    public function mobileStore(Request $request)
    {
        $user = $this->resolveMobileUser($request);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:admin,staff',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:transactions,scanner,products,supplies,expenses,customers',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 200);
        }

        $created = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'parent_id' => $user->id,
            'permissions' => $request->role === 'staff' ? ($request->permissions ?? []) : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Petugas gudang berhasil ditambahkan!',
            'user' => $created
        ]);
    }

    public function mobileUpdate(Request $request, $id)
    {
        $user = $this->resolveMobileUser($request);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $targetUser = User::where('id', $id)->where('parent_id', $user->id)->first();
        if (!$targetUser) {
            return response()->json(['success' => false, 'message' => 'Petugas tidak ditemukan.'], 404);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $targetUser->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|in:admin,staff',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:transactions,scanner,products,supplies,expenses,customers',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 200);
        }

        $targetUser->name = $request->name;
        $targetUser->email = $request->email;
        $targetUser->role = $request->role;
        $targetUser->permissions = $request->role === 'staff' ? ($request->permissions ?? []) : null;

        if ($request->filled('password')) {
            $targetUser->password = Hash::make($request->password);
        }

        $targetUser->save();

        return response()->json([
            'success' => true,
            'message' => 'Detail petugas berhasil diperbarui!',
            'user' => $targetUser
        ]);
    }

    public function mobileDestroy(Request $request, $id)
    {
        $user = $this->resolveMobileUser($request);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        if ($user->id == $id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak bisa menghapus akun Anda sendiri.'], 200);
        }

        $targetUser = User::where('id', $id)->where('parent_id', $user->id)->first();
        if (!$targetUser) {
            return response()->json(['success' => false, 'message' => 'Petugas tidak ditemukan.'], 404);
        }

        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => 'Petugas gudang berhasil dihapus!'
        ]);
    }

    private function resolveMobileUser(Request $request)
    {
        $token = $request->bearerToken() ?? $request->header('X-Mobile-Token');
        if (!$token) return null;
        try {
            $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($token);
            $parts = explode('|', $decrypted);
            return \App\Models\User::find($parts[0]);
        } catch (\Exception $e) {
            return null;
        }
    }
}

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
}

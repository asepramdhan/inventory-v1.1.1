<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user || $user->role !== $role) {
            if ($request->expectsJson() || $request->header('X-Mobile-Token')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak akses (Role: ' . $role . ' required).'
                ], 403);
            }
            abort(403, 'Anda tidak memiliki wewenang untuk mengakses halaman ini.');
        }

        return $next($request);
    }
}

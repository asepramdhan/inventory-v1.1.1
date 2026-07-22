<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // Mobile token validation fallback
        if (!$user) {
            $token = $request->bearerToken() ?? $request->header('X-Mobile-Token');
            if ($token) {
                try {
                    $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($token);
                    $parts = explode('|', $decrypted);
                    $user = \App\Models\User::find($parts[0]);
                } catch (\Exception $e) {
                    // Fall through
                }
            }
        }

        if (!$user || !$user->hasPermission($permission)) {
            if ($request->expectsJson() || $request->header('X-Mobile-Token')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak akses untuk modul ' . $permission . ' woy.'
                ], 403);
            }
            abort(403, 'Anda tidak memiliki hak akses untuk modul ' . $permission . ' woy.');
        }

        return $next($request);
    }
}

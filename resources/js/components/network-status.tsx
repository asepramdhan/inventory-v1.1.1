import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [latency, setLatency] = useState<number | null>(null);
    const [connectionType, setConnectionType] = useState<string>('unknown');
    const [isChecking, setIsChecking] = useState(false);

    const checkLatency = async () => {
        if (!navigator.onLine) {
            setIsOnline(false);
            setLatency(null);
            return;
        }
        setIsChecking(true);
        const startTime = performance.now();
        try {
            // Fetch relative robots.txt with cache busting to measure real round-trip time (RTT)
            await fetch('/robots.txt?t=' + Date.now(), { cache: 'no-store', method: 'HEAD' });
            const endTime = performance.now();
            const rtt = Math.round(endTime - startTime);
            setLatency(rtt);
            setIsOnline(true);
        } catch (error) {
            // Even if robots.txt doesn't exist, a 404 response still completes the HTTP request
            // If it fails completely, the connection might be broken
            try {
                await fetch('/?t=' + Date.now(), { cache: 'no-store', method: 'HEAD' });
                const endTime = performance.now();
                setLatency(Math.round(endTime - startTime));
                setIsOnline(true);
            } catch (innerError) {
                setLatency(null);
            }
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            checkLatency();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setLatency(null);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkLatency();

        // Interval checks every 30 seconds
        const interval = setInterval(checkLatency, 30000);

        // Network connection API (if supported)
        const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (conn) {
            setConnectionType(conn.effectiveType || 'unknown');
            const handleConnChange = () => {
                setConnectionType(conn.effectiveType || 'unknown');
                checkLatency();
            };
            conn.addEventListener('change', handleConnChange);
            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
                clearInterval(interval);
                conn.removeEventListener('change', handleConnChange);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    // Determine signal quality styles
    let statusText = 'Unknown';
    let statusColor = 'text-muted-foreground bg-muted';
    let dotColor = 'bg-muted-foreground';
    let signalStrength = 'Tidak Diketahui';

    if (!isOnline) {
        statusText = 'Offline';
        statusColor = 'text-destructive-foreground bg-destructive/10 dark:bg-destructive/20 text-red-600 dark:text-red-400 border border-red-500/20';
        dotColor = 'bg-red-500 animate-pulse';
        signalStrength = 'Terputus';
    } else if (latency !== null) {
        if (latency < 100) {
            statusText = 'Sinyal Bagus';
            statusColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/10';
            dotColor = 'bg-emerald-500';
            signalStrength = 'Lancar Jaya (Laten Rendah)';
        } else if (latency < 300) {
            statusText = 'Sinyal Cukup';
            statusColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-500/10';
            dotColor = 'bg-amber-500';
            signalStrength = 'Sedang (Laten Menengah)';
        } else {
            statusText = 'Sinyal Lemah';
            statusColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-500/10';
            dotColor = 'bg-rose-500 animate-pulse';
            signalStrength = 'Lambat (Laten Tinggi)';
        }
    } else {
        statusText = 'Terhubung';
        statusColor = 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-500/10';
        dotColor = 'bg-blue-500';
        signalStrength = 'Online';
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={checkLatency}
                        disabled={isChecking}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold select-none transition-all hover:bg-opacity-80 active:scale-95 duration-200",
                            statusColor
                        )}
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                        {isOnline ? (
                            <Wifi className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                            <WifiOff className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}
                        <span className="hidden sm:inline">
                            {latency !== null ? `${latency} ms` : statusText}
                        </span>
                        {isChecking && <RefreshCw className="h-3 w-3 animate-spin opacity-60 ml-0.5" />}
                    </button>
                </TooltipTrigger>
                <TooltipContent align="end" className="text-xs p-3 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                        Koneksi: <span className="underline">{statusText}</span>
                    </p>
                    <p>📶 Platform: <span className="font-semibold uppercase">{connectionType}</span></p>
                    {latency !== null && (
                        <p>⏱️ Kecepatan Ping: <span className="font-semibold">{latency} ms</span></p>
                    )}
                    <p className="text-[10px] text-muted-foreground pt-1 border-t border-dashed mt-1.5">
                        Kualitas: {signalStrength}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 italic">
                        Klik untuk perbarui status jaringan
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

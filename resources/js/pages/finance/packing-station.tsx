import { Head } from '@inertiajs/react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, ShoppingBag, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ScannedPackage {
  id: number;
  invoice_number: string;
  waybill_number: string | null;
  package_proof: string;
  store_name: string;
  platform: string;
  scanned_at: string;
}

export default function PackingStation() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [scannedList, setScannedList] = useState<ScannedPackage[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [isFocusLocked, setIsFocusLocked] = useState<boolean>(true);

  // Auto-detect front camera for mirroring
  useEffect(() => {
    if (!selectedDeviceId) return;
    const currentDevice = devices.find(d => d.deviceId === selectedDeviceId);
    if (currentDevice) {
      const label = currentDevice.label.toLowerCase();
      const isFront = label.includes('front') || label.includes('selfie') || label.includes('user') || label.includes('kemuka');
      setIsMirrored(isFront);
    }
  }, [selectedDeviceId, devices]);

  // Web Audio API Sound Generator
  const playBeep = (isSuccess: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        // Success: Dwi-nada ceria (high-pitch beep)
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(950, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.stop(ctx.currentTime + 0.22);
      } else {
        // Error: Buzzer serak (sawtooth low-frequency warning)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.error('Gagal memainkan suara alarm:', e);
    }
  };

  // Get list of video input devices
  const initCameraDevices = async () => {
    try {
      let videoDevices: MediaDeviceInfo[] = [];
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
        tempStream.getTracks().forEach(track => track.stop()); // Stop immediately
        setHasCameraPermission(true);

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      } catch (err) {
        console.warn('Camera access denied or missing:', err);
        setHasCameraPermission(false);
      }

      const mockDevice = {
        deviceId: 'mock-camera',
        groupId: 'mock',
        kind: 'videoinput' as MediaDeviceKind,
        label: '🎥 Kamera Simulasi (Uji Coba)',
        toJSON: () => ({})
      };

      const finalDevices = [...videoDevices, mockDevice];
      setDevices(finalDevices);

      if (videoDevices.length > 0) {
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') || 
          d.label.toLowerCase().includes('environment') ||
          d.label.toLowerCase().includes('belakang')
        );
        setSelectedDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
      } else {
        setSelectedDeviceId('mock-camera');
      }
    } catch (err) {
      console.error('Error initializing devices:', err);
    }
  };

  // Bind stream to video element when device ID changes
  const startCameraStream = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (!selectedDeviceId || selectedDeviceId === 'mock-camera') {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    try {
      const constraints = {
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Gagal memuat feed kamera:', err);
    }
  };

  useEffect(() => {
    initCameraDevices();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      startCameraStream();
    }
  }, [selectedDeviceId]);

  // Keep barcode input focused
  useEffect(() => {
    if (!isFocusLocked) return;
    const focusTimer = setInterval(() => {
      if (document.activeElement?.tagName !== 'INPUT') {
        inputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focusTimer);
  }, [isFocusLocked]);

  // Capture canvas frame from video
  const captureFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      if (selectedDeviceId === 'mock-camera' || !videoRef.current) {
        // Draw Brown Cardboard Box simulation
        ctx.fillStyle = '#111827'; 
        ctx.fillRect(0, 0, 1280, 720);

        // Brown box
        ctx.fillStyle = '#b45309'; 
        ctx.fillRect(340, 160, 600, 400);
        
        // Brown tape
        ctx.fillStyle = '#78350f'; 
        ctx.fillRect(340, 335, 600, 50);

        // Shipping Label Sticker
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(490, 210, 300, 220);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(500, 220, 280, 200);

        // Logo
        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('SHOPEE EXPRESS', 525, 255);

        ctx.beginPath();
        ctx.moveTo(510, 275);
        ctx.lineTo(770, 275);
        ctx.stroke();

        // Barcode lines
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 28; i++) {
          const width = (i % 3 === 0) ? 6 : (i % 2 === 0) ? 2 : 4;
          ctx.fillRect(520 + (i * 8), 290, width, 55);
        }

        // Barcode Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(barcode || 'DEMO-BARCODE-123', 520, 365);

        // Info
        ctx.fillStyle = '#374151';
        ctx.font = '11px Arial';
        ctx.fillText('Penerima: Simulasi Sistem', 525, 395);
        ctx.fillText('Status Paket: OK', 525, 410);

        // Green HUD text
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`SIMULATED CAMERA SCAN - ${new Date().toLocaleTimeString('id-ID')} WIB`, 40, 50);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      } else {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      }
    });
  };

  const getXsrfToken = () => {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage(null);

    const imageBlob = await captureFrame();
    if (!imageBlob) {
      setStatusMessage({ text: 'Gagal mengambil gambar dari feed webcam.', type: 'error' });
      playBeep(false);
      setIsProcessing(false);
      return;
    }

    const formData = new FormData();
    formData.append('barcode', cleanBarcode);
    formData.append('package_proof', imageBlob, 'webcam_proof.jpg');

    try {
      const response = await fetch('/finance/transactions/barcode-upload-proof', {
        method: 'POST',
        headers: {
          'X-XSRF-TOKEN': getXsrfToken(),
          'Accept': 'application/json'
        },
        body: formData
      });

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('Server returned non-JSON:', text);
        setStatusMessage({ text: `Server error (${response.status}): Gagal memproses respons server.`, type: 'error' });
        playBeep(false);
        setIsProcessing(false);
        return;
      }

      if (response.ok && result.success) {
        playBeep(true);
        setStatusMessage({ text: `Sukses mendokumentasikan resi / pesanan: ${cleanBarcode}`, type: 'success' });
        
        // Add to history list at the top
        const newPkg: ScannedPackage = {
          id: result.transaction.id,
          invoice_number: result.transaction.invoice_number,
          waybill_number: result.transaction.waybill_number,
          package_proof: result.transaction.package_proof,
          store_name: result.transaction.store_name,
          platform: result.transaction.platform,
          scanned_at: new Date().toLocaleTimeString('id-ID')
        };
        setScannedList(prev => [newPkg, ...prev.slice(0, 4)]);
      } else {
        playBeep(false);
        setStatusMessage({ text: result.message || 'Resi tidak terdaftar di sistem.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      playBeep(false);
      setStatusMessage({ text: 'Koneksi error, gagal mengunggah berkas.', type: 'error' });
    } finally {
      setBarcode('');
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <>
      <Head title="Stasiun Packing Otomatis" />
      <div className="flex flex-col xl:flex-row h-full w-full gap-5 p-4 rounded-xl overflow-y-auto">
        
        {/* LEFT COLUMN: LIVE WEBCAM VIEWER */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-zinc-950/80 rounded-2xl overflow-hidden shadow-2xl relative">
            <CardContent className="p-0 relative aspect-[16/9] flex items-center justify-center bg-black">
              {selectedDeviceId === 'mock-camera' ? (
                <div className="text-center p-6 text-zinc-400 space-y-4 w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800/20 rounded-2xl relative overflow-hidden aspect-[16/9]">
                  {/* Laser scan line effect */}
                  <div className="absolute inset-x-0 h-1 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce top-1/2" />
                  <div className="h-14 w-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 animate-pulse">
                    <Camera className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 z-10">
                    <p className="text-sm font-bold text-zinc-200">Kamera Simulasi Aktif</p>
                    <p className="text-xs text-zinc-500 px-8 leading-relaxed">PC Anda tidak memiliki webcam atau akses diblokir. Mode simulasi siap memotret paket otomatis saat scan barcode.</p>
                  </div>
                  <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-500/20 z-10 animate-pulse">
                    STATUS: READY FOR MOCK SCAN
                  </div>
                </div>
              ) : hasCameraPermission === false ? (
                <div className="text-center p-6 text-zinc-400 space-y-3">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <p className="text-sm font-bold">Kamera Terblokir atau Tidak Ditemukan</p>
                  <p className="text-xs text-zinc-500">Berikan izin browser untuk mengakses kamera Anda terlebih dahulu.</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    LIVE FEED ACTIVE
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Device Selection dropdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Camera className="h-4.5 w-4.5 text-zinc-400" />
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-350 shrink-0">Sumber Kamera</Label>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMirrored(!isMirrored)}
                className="h-9 text-xs rounded-xl flex items-center gap-1.5 shrink-0"
                disabled={selectedDeviceId === 'mock-camera'}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {isMirrored ? 'Normal' : 'Cermin'}
              </Button>

              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-foreground h-9 px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 max-w-xs focus:outline-none"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SCANNER INPUT & LOG */}
        <div className="w-full xl:w-96 flex flex-col gap-4">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Barcode Scanner Console</h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Arahkan scanner laser ke barcode No. Resi atau No. Pesanan.</p>
              </div>

              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Scan barcode di sini..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    readOnly={isProcessing}
                    className="h-12 text-xs font-mono font-bold tracking-wider rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 focus-visible:ring-indigo-500 text-center pr-10 focus:outline-none"
                    autoFocus
                  />
                  {isProcessing && (
                    <RefreshCw className="h-4.5 w-4.5 absolute right-3 top-3.5 text-indigo-500 animate-spin" />
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={!barcode.trim() || isProcessing}
                  className="w-full h-10 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl"
                >
                  Proses Dokumen (Enter)
                </Button>
              </form>

              {/* Mobile Auto Focus control utilities */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 px-1">
                <div className="flex items-center gap-1.5">
                  <input 
                    type="checkbox" 
                    id="focus-lock-checkbox"
                    checked={isFocusLocked}
                    onChange={(e) => setIsFocusLocked(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-800 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <label htmlFor="focus-lock-checkbox" className="cursor-pointer font-semibold select-none">
                    Kunci Fokus Input (Auto-Focus)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold"
                >
                  Fokus Manual
                </button>
              </div>

              {/* Status Alert Banner */}
              {statusMessage && (
                <div className={`p-4 rounded-xl border flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                }`}>
                  {statusMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <p className="text-[11px] font-semibold leading-relaxed">{statusMessage.text}</p>
                </div>
              )}
            </div>
          </Card>

          {/* RECENT SCAN LOGS FEED */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="space-y-4 flex-1 flex flex-col">
              <h3 className="font-extrabold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Aktivitas Terakhir</h3>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
                {scannedList.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                    <ShoppingBag className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                    <p className="text-[11px] font-bold">Belum Ada Aktivitas Scan</p>
                    <p className="text-[10px] text-zinc-500">Mulai scan untuk melihat rekaman bukti foto.</p>
                  </div>
                ) : (
                  scannedList.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10 hover:border-zinc-300 transition-all duration-200 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Image Preview inside Dialog zoom */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="h-12 w-16 rounded-lg overflow-hidden border bg-muted flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity shrink-0 relative group">
                              <img src={`/storage/${pkg.package_proof}`} alt="Snapshot" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                                <Eye className="h-3 w-3" />
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-3xl p-1 bg-black border-none rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative w-full max-h-[85vh] bg-zinc-950 flex items-center justify-center">
                              <img src={`/storage/${pkg.package_proof}`} alt="Full Snapshot" className="max-w-full max-h-[85vh] object-contain" />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <div className="min-w-0 space-y-0.5">
                          <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{pkg.invoice_number}</p>
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                            {pkg.store_name} <span className="uppercase text-[9px] text-indigo-500">({pkg.platform})</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">{pkg.scanned_at}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </>
  );
}

PackingStation.layout = {
  breadcrumbs: [
    { title: 'Keuangan & Analisa', href: '#' },
    { title: 'Stasiun Packing Otomatis', href: '/finance/transactions/packing-station' },
  ],
};

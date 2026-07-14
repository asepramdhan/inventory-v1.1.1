import { Head, router, useForm } from '@inertiajs/react';
import { Archive, Database, Download, FileArchive, HardDrive, RefreshCw, AlertTriangle, Trash2, Upload, Calendar } from 'lucide-react';
import { useState, useRef } from 'react';
import Heading from '@/components/heading';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface BackupFile {
  filename: string;
  size: number;
  created_at: number; // Unix timestamp
}

interface SummaryStats {
  total_backups: number;
  total_size: number;
  last_backup: string | null;
}

interface Props {
  backups: BackupFile[];
  summary: SummaryStats;
  errors: Record<string, string>;
}

export default function Backup({ backups, summary, errors }: Props) {
  const [isBackupProcessing, setIsBackupProcessing] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  
  // Dialog visibility states
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, setData, post, processing, reset } = useForm({
    file: null as File | null,
  });

  // Helpers
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Actions
  const handleCreateBackup = () => {
    setIsBackupProcessing(true);
    router.post(
      '/master-data/backups/create',
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsBackupProcessing(false);
          toast.success('Backup database baru berhasil dibuat!');
        },
        onError: (err) => {
          setIsBackupProcessing(false);
          toast.error(err.backup || 'Gagal membuat backup database.');
        },
      }
    );
  };

  const handleRestoreBackup = () => {
    if (!selectedFilename) return;
    setIsRestoreOpen(false);
    toast.info('Memulai proses pemulihan database... Mohon tunggu.');
    
    router.post(
      `/master-data/backups/${selectedFilename}/restore`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Database berhasil dipulihkan!');
          // Delay reload to let user sessions settle
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (err) => {
          toast.error(err.restore || 'Gagal memulihkan database.');
        },
      }
    );
  };

  const handleDeleteBackup = () => {
    if (!selectedFilename) return;
    setIsDeleteOpen(false);
    
    router.delete(
      `/master-data/backups/${selectedFilename}`,
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('File backup berhasil dihapus.');
        },
        onError: (err) => {
          toast.error(err.backup || 'Gagal menghapus file.');
        },
      }
    );
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setData('file', file);
      setIsUploadOpen(true);
    }
  };

  const handleUploadAndRestore = () => {
    setIsUploadOpen(false);
    if (!uploadFile) return;

    toast.info('Mengunggah & memulihkan database... Mohon tunggu.');
    
    post('/master-data/backups/upload-restore', {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Database berhasil dipulihkan dari file unggahan!');
        setUploadFile(null);
        reset();
        setTimeout(() => window.location.reload(), 1000);
      },
      onError: (err) => {
        toast.error(err.restore || 'Gagal memulihkan dari file.');
        setUploadFile(null);
        reset();
      },
    });
  };

  return (
    <>
      <Head title="Backup Database" />

      <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Heading
            title="Backup & Restore Database"
            description="Cadangkan data inventori Anda secara aman atau pulihkan dari backup sebelumnya."
          />
          <div className="flex items-center gap-2.5">
            {/* Hidden upload input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadFileChange}
              accept=".zip"
              className="hidden"
            />
            <Button
              variant="outline"
              disabled={isBackupProcessing || processing}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-medium text-xs h-10 px-4 gap-2 transition-all"
            >
              <Upload className="h-4 w-4 text-zinc-500" />
              Unggah & Pulihkan
            </Button>
            <Button
              disabled={isBackupProcessing || processing}
              onClick={handleCreateBackup}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-10 px-4 gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Database className={`h-4 w-4 ${isBackupProcessing ? 'animate-spin' : ''}`} />
              {isBackupProcessing ? 'Mencadangkan...' : 'Buat Backup Baru'}
            </Button>
          </div>
        </div>

        {/* Info Alert Box */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Perhatian Penting sebelum Melakukan Pemulihan (Restore):</span> Pemulihan database akan menghapus seluruh data tabel yang aktif saat ini dan menimpanya dengan isi dari file backup. Jika akun login Anda diubah dalam backup tersebut, sesi aktif Anda mungkin akan terputus dan Anda akan diminta masuk kembali. Disarankan melakukan backup data aktif saat ini terlebih dahulu sebelum memulihkan backup lama.
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Backups */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm transition-all hover:-translate-y-0.5 duration-200 bg-white dark:bg-zinc-900/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total File Backup</span>
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{summary.total_backups} <span className="text-sm font-medium text-zinc-400">Arsip</span></h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Archive className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Space Used */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm transition-all hover:-translate-y-0.5 duration-200 bg-white dark:bg-zinc-900/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Kapasitas Penyimpanan</span>
                <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{formatBytes(summary.total_size)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <HardDrive className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Last Backup */}
          <Card className="relative overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm transition-all hover:-translate-y-0.5 duration-200 bg-white dark:bg-zinc-900/50">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Pencadangan Terakhir</span>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[220px]">
                  {summary.last_backup ? summary.last_backup : 'Belum pernah'}
                </h3>
              </div>
              <div className="p-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl">
                <Calendar className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm overflow-hidden bg-white dark:bg-zinc-900/50">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Riwayat File Backup</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Format: ZIP (SQL Compressed)</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/30">
                <TableRow className="border-b border-zinc-200/40 dark:border-zinc-800/50">
                  <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 h-10 py-2.5 px-4 text-left">Nama File</TableHead>
                  <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 h-10 py-2.5 px-4 text-left">Tanggal Dibuat</TableHead>
                  <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 h-10 py-2.5 px-4 text-left">Ukuran File</TableHead>
                  <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 h-10 py-2.5 px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-zinc-400 dark:text-zinc-500 italic text-xs">
                      Belum ada file backup database yang tersimpan di server. Klik "Buat Backup Baru" untuk memulai.
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup, idx) => (
                    <TableRow
                      key={backup.filename}
                      className="border-b border-zinc-200/30 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                    >
                      <TableCell className="py-3 px-4 text-left font-medium text-zinc-800 dark:text-zinc-200 text-xs max-w-[280px] sm:max-w-md truncate">
                        <div className="flex items-center gap-2">
                          <FileArchive className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="truncate" title={backup.filename}>{backup.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-left text-zinc-500 dark:text-zinc-400 text-xs">
                        {formatDate(backup.created_at)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-left text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                        {formatBytes(backup.size)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/master-data/backups/${backup.filename}/download`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            title="Unduh File"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedFilename(backup.filename);
                              setIsRestoreOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/20"
                            title="Pulihkan Database"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedFilename(backup.filename);
                              setIsDeleteOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                            title="Hapus Backup"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              Konfirmasi Pemulihan Database
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed space-y-2 pt-2">
              <p>
                Apakah Anda yakin ingin memulihkan database ke file cadangan <span className="font-bold text-foreground font-mono">{selectedFilename}</span>?
              </p>
              <p className="font-semibold text-red-500 dark:text-red-400">
                Peringatan: Seluruh data aktif Anda saat ini akan dihapus permanen dan digantikan dengan data dari file backup tersebut! Tindakan ini tidak dapat dibatalkan.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="rounded-xl text-xs h-9">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreBackup}
              variant="destructive"
              className="rounded-xl text-xs h-9 font-medium shadow-sm transition-colors"
            >
              Ya, Pulihkan Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-500 text-base">Hapus File Backup</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus file backup <span className="font-bold text-foreground font-mono">{selectedFilename}</span> secara permanen dari server?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="rounded-xl text-xs h-9">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              variant="destructive"
              className="rounded-xl text-xs h-9 font-medium shadow-sm transition-colors"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Restore Confirmation Dialog */}
      <AlertDialog open={isUploadOpen} onOpenChange={(open) => {
        setIsUploadOpen(open);
        if (!open) {
          setUploadFile(null);
          reset();
        }
      }}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              Unggah & Pulihkan Database
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed space-y-2 pt-2">
              <p>
                Anda akan mengunggah file backup <span className="font-bold text-foreground font-mono">{uploadFile?.name}</span> ({uploadFile ? formatBytes(uploadFile.size) : ''}) dan langsung memulihkan database dari file tersebut.
              </p>
              <p className="font-semibold text-red-500 dark:text-red-400">
                Peringatan: Seluruh data aktif Anda saat ini akan dihapus permanen dan digantikan dengan data dari file backup yang diunggah!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="rounded-xl text-xs h-9">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUploadAndRestore}
              variant="destructive"
              className="rounded-xl text-xs h-9 font-medium shadow-sm transition-colors"
            >
              Unggah & Pulihkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

Backup.layout = {
  breadcrumbs: [
    { title: 'Master Data', href: '#' },
    { title: 'Backup Database', href: '/master-data/backups' },
  ],
};

import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontalIcon, Pencil, Plus, Trash2, User, Mail, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  permissions: string[] | null;
  created_at: string;
}

interface Props {
  users: UserItem[];
}

const AVAILABLE_PERMISSIONS = [
  { id: 'transactions', label: '📋 Riwayat & Kelola Transaksi (Web)' },
  { id: 'scanner', label: '📦 Stasiun Packing & Scanner Bukti (Web/Mobile)' },
  { id: 'products', label: '🏷️ Master Produk, HPP & Produsen (Web/Mobile)' },
  { id: 'supplies', label: '📦 Bahan & Lakban Gudang (Web/Mobile)' },
  { id: 'expenses', label: '💸 Catat Jajanan Gudang / Pengeluaran (Mobile)' },
  { id: 'customers', label: '👥 Master Daftar Pelanggan (Web)' },
];

function UserFormFields({
  data,
  setData,
  errors,
  isEdit = false,
  idPrefix = '',
}: {
  data: any;
  setData: (key: string, value: any) => void;
  errors: any;
  isEdit?: boolean;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}name`}>Nama Pengguna</Label>
        <div className="relative">
          <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}name`}
            placeholder="Contoh: Budi Prasetyo"
            className="pl-9 h-9 text-xs"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
          />
        </div>
        <InputError message={errors.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}email`}>Alamat Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}email`}
            type="email"
            placeholder="Contoh: budi@gudang.com"
            className="pl-9 h-9 text-xs"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
          />
        </div>
        <InputError message={errors.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}role`}>Hak Akses (Role)</Label>
        <select
          id={`${idPrefix}role`}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={data.role}
          onChange={(e) => {
            const role = e.target.value;
            setData('role', role);
            if (role === 'admin') {
              setData('permissions', []);
            }
          }}
        >
          <option value="staff">Staff Gudang (Terbatas)</option>
          <option value="admin">Administrator (Akses Semua)</option>
        </select>
        <InputError message={errors.role} />
      </div>

      {data.role === 'staff' && (
        <div className="space-y-2 border-t pt-3 mt-3">
          <Label className="text-zinc-700 dark:text-zinc-300 font-semibold block mb-1">
            Izin Akses Fitur / Modul Gudang woy:
          </Label>
          <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
            {AVAILABLE_PERMISSIONS.map((p) => {
              const isChecked = (data.permissions || []).includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-2.5 text-xs font-normal text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-650 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    onChange={() => {
                      let nextPerms = [...(data.permissions || [])];
                      if (isChecked) {
                        nextPerms = nextPerms.filter((item) => item !== p.id);
                      } else {
                        nextPerms.push(p.id);
                      }
                      setData('permissions', nextPerms);
                    }}
                  />
                  {p.label}
                </label>
              );
            })}
          </div>
          <InputError message={errors.permissions} />
        </div>
      )}

      <div className="space-y-1.5 pt-2 border-t mt-2">
        <Label htmlFor={`${idPrefix}password`}>
          Password {isEdit && '(Kosongkan jika tidak diubah)'}
        </Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}password`}
            type="password"
            placeholder={isEdit ? "Setel ulang password baru" : "Minimal 8 karakter"}
            className="pl-9 h-9 text-xs"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
          />
        </div>
        <InputError message={errors.password} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}password_confirmation`}>Konfirmasi Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id={`${idPrefix}password_confirmation`}
            type="password"
            placeholder="Masukkan kembali password"
            className="pl-9 h-9 text-xs"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
          />
        </div>
        <InputError message={errors.password_confirmation} />
      </div>
    </>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm animate-pulse">
      <div className="p-0">
        <Table>
          <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
            <TableRow>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nama Pengguna</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Email</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Role</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Daftar Modul Izin</TableHead>
              <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Tanggal Terdaftar</TableHead>
              <TableHead className="w-[80px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800/60">
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32 py-2" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-40" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-48" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" /></TableCell>
                <TableCell className="text-center"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Users({ users }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const createForm = useForm({
    name: '',
    email: '',
    role: 'staff',
    permissions: [] as string[],
    password: '',
    password_confirmation: '',
  });

  const editForm = useForm({
    name: '',
    email: '',
    role: 'staff',
    permissions: [] as string[],
    password: '',
    password_confirmation: '',
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post('/master-data/users', {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    editForm.put(`/master-data/users/${selectedUser.id}`, {
      onSuccess: () => {
        setIsEditOpen(false);
        editForm.reset();
        setSelectedUser(null);
      },
    });
  };

  const handleDeleteUser = (id: number) => {
    router.delete(`/master-data/users/${id}`);
  };

  return (
    <>
      <Head title="Kelola Pengguna woy" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Heading
            title="Kelola Pengguna"
            description="Atur hak akses akun sistem, tambahkan admin atau staff gudang baru woy."
          />
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <Button className="bg-indigo-650 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs rounded-xl shadow-sm self-start">
                <Plus className="h-4 w-4" /> Tambah Pengguna
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
              <SheetHeader className="p-6 border-b bg-background">
                <SheetTitle>Tambah Pengguna Baru</SheetTitle>
                <SheetDescription>
                  Daftarkan admin baru atau staff pembantu gudang woy.
                </SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <UserFormFields
                  data={createForm.data}
                  setData={createForm.setData}
                  errors={createForm.errors}
                  isEdit={false}
                />
                <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                  <Button type="submit" disabled={createForm.processing} className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs">
                    {createForm.processing ? 'Mendaftarkan...' : 'Daftarkan Pengguna'}
                  </Button>
                  <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {isLoading ? (
          <UsersTableSkeleton />
        ) : (
          <Card className="rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50/55 dark:bg-zinc-800/30 border-b border-zinc-150 dark:border-zinc-800/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nama Pengguna</TableHead>
                      <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Email</TableHead>
                      <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Role / Hak Akses</TableHead>
                      <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Izin Modul</TableHead>
                      <TableHead className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Tanggal Ditambahkan</TableHead>
                      <TableHead className="w-[80px] text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          Belum ada pengguna terdaftar (selain Anda).
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                          <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{user.name}</TableCell>
                          <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</TableCell>
                          <TableCell className="text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${user.role === 'admin' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                              {user.role === 'admin' ? 'Administrator' : 'Staff Gudang'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {user.role === 'admin' ? (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Semua Modul Terbuka</span>
                            ) : (user.permissions && user.permissions.length > 0) ? (
                              <div className="flex flex-wrap gap-1 max-w-[280px]">
                                {user.permissions.map((p) => {
                                  const match = AVAILABLE_PERMISSIONS.find((item) => item.id === p);
                                  return (
                                    <span key={p} className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] font-medium border border-zinc-200/50 dark:border-zinc-700/50">
                                      {match ? match.label.split(' ')[1] : p}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] text-rose-500 italic font-semibold">Tidak Ada Akses woy</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400 dark:text-zinc-500">
                            {new Date(user.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[140px] z-50">
                                <DropdownMenuItem
                                  className="text-xs gap-2 cursor-pointer"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    editForm.setData({
                                      name: user.name,
                                      email: user.email,
                                      role: user.role,
                                      permissions: user.permissions || [],
                                      password: '',
                                      password_confirmation: '',
                                    });
                                    setIsEditOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-xs gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" /> Hapus User
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs">
                                        Akun <b>{user.name}</b> ({user.email}) akan dihapus secara permanen dari database woy.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="text-xs">
                                      <AlertDialogCancel className="rounded-xl text-xs">Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs"
                                        onClick={() => handleDeleteUser(user.id)}
                                      >
                                        Hapus Akun
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Sheet
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setSelectedUser(null);
              editForm.reset();
            }
          }}
        >
          <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
            <SheetHeader className="p-6 border-b bg-background">
              <SheetTitle>Edit Pengguna</SheetTitle>
              <SheetDescription>
                Perbarui info atau reset password user{selectedUser ? `: ${selectedUser.name}` : ''}.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <UserFormFields
                idPrefix="edit-"
                data={editForm.data}
                setData={editForm.setData}
                errors={editForm.errors}
                isEdit={true}
              />

              <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                <Button type="submit" disabled={editForm.processing} className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs">
                  {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
                <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

Users.layout = {
  breadcrumbs: [
    { title: 'Master Data & Sistem', href: '#' },
    { title: 'Kelola Pengguna', href: '/master-data/users' },
  ],
};

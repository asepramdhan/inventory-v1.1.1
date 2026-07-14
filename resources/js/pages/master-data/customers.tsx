import { Head, router } from '@inertiajs/react';
import { Coins, MoreHorizontalIcon, Pencil, Plus, Search, Trash2, Users, Phone, MapPin, Globe, ShoppingBag } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function CustomerTableSkeleton() {
  return (
    <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm animate-pulse">
      <div className="p-4">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-150 dark:border-zinc-800/50">
            <TableRow>
              <TableHead className="text-xs">Pelanggan</TableHead>
              <TableHead className="text-xs">Platform</TableHead>
              <TableHead className="text-xs">No. Telepon</TableHead>
              <TableHead className="text-xs text-center">Total Order</TableHead>
              <TableHead className="text-xs text-right">Total Belanja</TableHead>
              <TableHead className="text-right text-xs">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4].map((i) => (
              <TableRow key={i} className="border-b border-zinc-100 dark:border-zinc-800/60">
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                  </div>
                </TableCell>
                <TableCell><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-12" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" /></TableCell>
                <TableCell><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-8 mx-auto" /></TableCell>
                <TableCell><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-8 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Customers({ customers, filters }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const isFirstMount = useRef(true);

  // States filter & search
  const [search, setSearch] = useState(filters.search || '');
  const [platformFilter, setPlatformFilter] = useState(filters.platform || 'all');

  // States modal & sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSheetOpenEdit, setIsSheetOpenEdit] = useState(false);
  const [isSheetOpenDetail, setIsSheetOpenDetail] = useState(false);
  
  // Data State Form
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [platform, setPlatform] = useState('manual');
  const [biteshipAreaId, setBiteshipAreaId] = useState('');
  const [biteshipAreaName, setBiteshipAreaName] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingAreas, setIsSearchingAreas] = useState(false);
  
  const [errors, setErrors] = useState<any>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search & filter sync
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const delayDebounce = setTimeout(() => {
      router.get(
        '/master-data/customers',
        {
          search: search,
          platform: platformFilter,
        },
        {
          preserveState: true,
          replace: true,
          preserveScroll: true,
        }
      );
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [search, platformFilter]);

  useEffect(() => {
    if (areaSearchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAreas(true);
      try {
        const response = await fetch(`/api/biteship/search-areas?query=${encodeURIComponent(areaSearchQuery)}`);
        const data = await response.json();
        setSearchResults(data.areas || []);
      } catch (err) {
        console.error('Error fetching areas', err);
      } finally {
        setIsSearchingAreas(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [areaSearchQuery]);

  const resetForm = () => {
    setName('');
    setUsername('');
    setPhone('');
    setAddress('');
    setPlatform('manual');
    setBiteshipAreaId('');
    setBiteshipAreaName('');
    setAreaSearchQuery('');
    setSearchResults([]);
    setErrors({});
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    router.post('/master-data/customers', {
      name,
      username: username || null,
      phone: phone || null,
      address: address || null,
      platform,
      biteship_area_id: biteshipAreaId || null,
      biteship_area_name: biteshipAreaName || null,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsSheetOpen(false);
        resetForm();
      },
      onError: (err) => {
        setErrors(err);
      },
      onFinish: () => setProcessing(false)
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setProcessing(true);
    setErrors({});

    router.put(`/master-data/customers/${selectedCustomer.id}`, {
      name,
      username: username || null,
      phone: phone || null,
      address: address || null,
      platform,
      biteship_area_id: biteshipAreaId || null,
      biteship_area_name: biteshipAreaName || null,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsSheetOpenEdit(false);
        setSelectedCustomer(null);
        resetForm();
      },
      onError: (err) => {
        setErrors(err);
      },
      onFinish: () => setProcessing(false)
    });
  };

  const handleDelete = (id: number) => {
    router.delete(`/master-data/customers/${id}`, {
      preserveScroll: true,
      onSuccess: () => {
        // success toast is handled by controller flash session
      }
    });
  };

  const openEditSheet = (cust: any) => {
    setSelectedCustomer(cust);
    setName(cust.name);
    setUsername(cust.username || '');
    setPhone(cust.phone || '');
    setAddress(cust.address || '');
    setPlatform(cust.platform);
    setBiteshipAreaId(cust.biteship_area_id || '');
    setBiteshipAreaName(cust.biteship_area_name || '');
    setIsSheetOpenEdit(true);
  };

  const openDetailSheet = (cust: any) => {
    setSelectedCustomer(cust);
    setIsSheetOpenDetail(true);
  };

  const formatIDR = (amount: any) => {
    const val = parseFloat(amount || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <>
      <Head title="Daftar Pelanggan" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Row Header & Trigger Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Heading
            title="Daftar Pelanggan"
            description="Kelola profil pembeli, lacak total order, dan analisa tingkat loyalitas belanja mereka."
          />
          <Sheet
            open={isSheetOpen}
            onOpenChange={(open) => {
              setIsSheetOpen(open);
              if (!open) resetForm();
            }}
          >
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto h-11 sm:h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pelanggan
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
              <SheetHeader className="p-6 pb-0">
                <SheetTitle>Tambah Pelanggan Baru</SheetTitle>
                <SheetDescription>Daftarkan profil pelanggan baru secara manual.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="grid flex-1 gap-5 px-6 py-4 overflow-y-auto no-scrollbar">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Penerima / Nama Pelanggan</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Budi Santoso" className="rounded-xl h-10" />
                    <InputError message={errors.name} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="platform">Asal Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform" className="rounded-xl h-10">
                        <SelectValue placeholder="Pilih Platform" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="manual">Manual / Toko Offline</SelectItem>
                        <SelectItem value="shopee">Shopee</SelectItem>
                        <SelectItem value="lazada">Lazada</SelectItem>
                        <SelectItem value="tokopedia">Tokopedia</SelectItem>
                        <SelectItem value="tiktok">TikTok Shop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username Marketplace (Opsional)</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: budi_shopee99" className="rounded-xl h-10" />
                    <InputError message={errors.username} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Nomor Telepon (Opsional)</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 08123456789" className="rounded-xl h-10" />
                    <InputError message={errors.phone} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Alamat Pengiriman (Opsional)</Label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masukkan alamat lengkap rumah/toko pelanggan..."
                      className="flex min-h-[90px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <InputError message={errors.address} />
                  </div>

                  {/* Wilayah / Kecamatan (Biteship Autocomplete) */}
                  <div className="grid gap-2.5 relative">
                    <Label htmlFor="area_search">Kecamatan / Kelurahan (Untuk Ongkos Kirim)</Label>
                    {biteshipAreaName ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/20 text-xs">
                        <span className="font-medium text-foreground">{biteshipAreaName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBiteshipAreaId('');
                            setBiteshipAreaName('');
                            setAreaSearchQuery('');
                          }}
                          className="h-7 px-2.5 text-xs text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        >
                          Ganti
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                          <Input
                            id="area_search"
                            type="text"
                            placeholder="Cari kecamatan (misal: Kebayoran Lama)..."
                            value={areaSearchQuery}
                            onChange={(e) => setAreaSearchQuery(e.target.value)}
                            className="pl-9 text-xs rounded-xl bg-background"
                          />
                        </div>
                        {isSearchingAreas && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 p-3 text-xs text-center text-zinc-500 animate-pulse">
                            Mencari wilayah...
                          </div>
                        )}
                        {!isSearchingAreas && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-800">
                            {searchResults.map((area: any) => (
                              <div
                                key={area.id}
                                onClick={() => {
                                  setBiteshipAreaId(area.id);
                                  setBiteshipAreaName(`${area.name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}`);
                                  setSearchResults([]);
                                  setAreaSearchQuery('');
                                }}
                                className="p-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer text-left text-zinc-700 dark:text-zinc-300 transition-colors"
                              >
                                {area.name}, {area.administrative_division_level_2_name}, {area.administrative_division_level_1_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <input type="hidden" name="biteship_area_id" value={biteshipAreaId} />
                    <input type="hidden" name="biteship_area_name" value={biteshipAreaName} />
                    <InputError message={errors.biteship_area_id} />
                  </div>
                </div>
                <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
                  <Button type="submit" disabled={processing} className="flex-1 sm:flex-none rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                    {processing ? 'Menyimpan...' : 'Simpan Pelanggan'}
                  </Button>
                  <SheetClose asChild>
                    <Button type="button" variant="outline" className="flex-1 sm:flex-none rounded-xl">Batal</Button>
                  </SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* Action filter panel */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari nama, username, nomor telepon, atau alamat pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80 focus-visible:ring-indigo-500 w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full lg:w-[180px] h-10 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/80">
                <SelectValue placeholder="Pilih Platform" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Semua Platform</SelectItem>
                <SelectItem value="manual">Manual / Offline</SelectItem>
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="lazada">Lazada</SelectItem>
                <SelectItem value="tokopedia">Tokopedia</SelectItem>
                <SelectItem value="tiktok">TikTok Shop</SelectItem>
              </SelectContent>
            </Select>

            {(search !== '' || platformFilter !== 'all') && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearch('');
                  setPlatformFilter('all');
                }}
                className="text-xs h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-950 transition-colors shrink-0"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Content list / Table */}
        {isLoading ? (
          <CustomerTableSkeleton />
        ) : customers.data.length === 0 ? (
          <Empty className="py-12 border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm">
            <Users className="h-10 w-10 text-zinc-400" />
            <EmptyHeader className="mt-4">
              <EmptyTitle>Belum Ada Pelanggan</EmptyTitle>
              <EmptyDescription>
                {search || platformFilter !== 'all'
                  ? 'Tidak ada pelanggan yang cocok dengan kata kunci filter pencarian Anda.'
                  : 'Database pelanggan masih kosong. Pelanggan otomatis tercatat saat Anda mengimpor pesanan Shopee.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-sm">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-150 dark:border-zinc-800/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-3">Nama Pelanggan / Username</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-3">Platform</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-3">Kontak</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-3 text-center">Total Order</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-3 text-right">Total Belanja</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-3 w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.data.map((cust: any) => {
                    const isMasked = cust.name.includes('*') || (cust.username && cust.username.includes('*'));

                    return (
                      <TableRow 
                        key={cust.id} 
                        onClick={() => openDetailSheet(cust)}
                        className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer"
                      >
                        <TableCell className="py-3">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm truncate flex items-center gap-1.5">
                              {cust.name}
                              {isMasked && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[9px] font-semibold px-2 py-0.5 rounded-md border border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 bg-zinc-50/40 dark:bg-zinc-950/20 select-none shrink-0"
                                >
                                  Disensor
                                </Badge>
                              )}
                            </span>
                            {cust.username && (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                                @{cust.username}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            className={`capitalize px-2.5 py-0.5 rounded-full font-medium text-[10.5px] border ${
                              cust.platform === 'shopee'
                                ? 'bg-orange-50/50 text-orange-600 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/30'
                                : cust.platform === 'manual'
                                ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/10 dark:text-indigo-400 dark:border-indigo-900/30'
                                : 'bg-zinc-50 text-zinc-600 border-zinc-150 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-800'
                            }`}
                          >
                            {cust.platform === 'manual' ? (
                              <Users className="h-3 w-3 inline mr-1 shrink-0" />
                            ) : (
                              <Globe className="h-3 w-3 inline mr-1 shrink-0" />
                            )}
                            {cust.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {cust.phone ? (
                              <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                                <Phone className="h-3 w-3 text-zinc-400" /> {cust.phone}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                            {cust.address && (
                              <span className="flex items-center gap-1 text-zinc-400 text-[11px] truncate max-w-[190px]">
                                <MapPin className="h-3 w-3 shrink-0" /> {cust.address}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="outline" className="rounded-full bg-zinc-50/60 dark:bg-zinc-900/40 font-semibold px-2 py-0.5 text-xs">
                            {cust.transactions_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {formatIDR(cust.transactions_sum_grand_total)}
                        </TableCell>
                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-250"
                              >
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => openDetailSheet(cust)} className="rounded-lg cursor-pointer text-xs">
                                <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                                Rincian Alamat & Spend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditSheet(cust)} className="rounded-lg cursor-pointer text-xs">
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit Profil
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="flex w-full items-center px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-md transition-colors">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Hapus Pelanggan
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus pelanggan <strong>{cust.name}</strong>? Penghapusan ini tidak menghapus data transaksi mereka, melainkan melepas kaitan relasi saja.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(cust.id)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
                                      Ya, Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {customers.last_page > 1 && (
              <div className="flex items-center justify-between gap-4 mt-2 bg-white/70 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/80 p-3 rounded-2xl backdrop-blur-md">
                <p className="text-xs text-zinc-500">
                  Menampilkan <span className="font-semibold text-zinc-800 dark:text-zinc-200">{customers.from}-{customers.to}</span> dari <span className="font-semibold text-zinc-800 dark:text-zinc-200">{customers.total}</span> pelanggan.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    disabled={!customers.prev_page_url}
                    onClick={() => customers.prev_page_url && router.get(customers.prev_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-xl"
                    disabled={!customers.next_page_url}
                    onClick={() => customers.next_page_url && router.get(customers.next_page_url, {}, { preserveState: true, replace: true, preserveScroll: true })}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheet Edit Pelanggan */}
      <Sheet
        open={isSheetOpenEdit}
        onOpenChange={(open) => {
          setIsSheetOpenEdit(open);
          if (!open) {
            setSelectedCustomer(null);
            resetForm();
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Edit Profil Pelanggan</SheetTitle>
            <SheetDescription>Perbarui data identifikasi pelanggan.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="grid flex-1 gap-5 px-6 py-4 overflow-y-auto no-scrollbar">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Penerima / Nama Pelanggan</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Contoh: Budi Santoso" className="rounded-xl h-10" />
                <InputError message={errors.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-platform">Asal Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="edit-platform" className="rounded-xl h-10">
                    <SelectValue placeholder="Pilih Platform" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="manual">Manual / Toko Offline</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="lazada">Lazada</SelectItem>
                    <SelectItem value="tokopedia">Tokopedia</SelectItem>
                    <SelectItem value="tiktok">TikTok Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username Marketplace (Opsional)</Label>
                <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: budi_shopee99" className="rounded-xl h-10" />
                <InputError message={errors.username} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Nomor Telepon (Opsional)</Label>
                <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 08123456789" className="rounded-xl h-10" />
                <InputError message={errors.phone} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Alamat Pengiriman (Opsional)</Label>
                <textarea
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap..."
                  className="flex min-h-[90px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <InputError message={errors.address} />
              </div>

              {/* Wilayah / Kecamatan (Biteship Autocomplete) */}
              <div className="grid gap-2.5 relative">
                <Label htmlFor="edit_area_search">Kecamatan / Kelurahan (Untuk Ongkos Kirim)</Label>
                {biteshipAreaName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/20 text-xs">
                    <span className="font-medium text-foreground">{biteshipAreaName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBiteshipAreaId('');
                        setBiteshipAreaName('');
                        setAreaSearchQuery('');
                      }}
                      className="h-7 px-2.5 text-xs text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      Ganti
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="edit_area_search"
                        type="text"
                        placeholder="Cari kecamatan (misal: Kebayoran Lama)..."
                        value={areaSearchQuery}
                        onChange={(e) => setAreaSearchQuery(e.target.value)}
                        className="pl-9 text-xs rounded-xl bg-background"
                      />
                    </div>
                    {isSearchingAreas && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 p-3 text-xs text-center text-zinc-500 animate-pulse">
                        Mencari wilayah...
                      </div>
                    )}
                    {!isSearchingAreas && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-800">
                        {searchResults.map((area: any) => (
                          <div
                            key={area.id}
                            onClick={() => {
                              setBiteshipAreaId(area.id);
                              setBiteshipAreaName(`${area.name}, ${area.administrative_division_level_2_name}, ${area.administrative_division_level_1_name}`);
                              setSearchResults([]);
                              setAreaSearchQuery('');
                            }}
                            className="p-2.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer text-left text-zinc-700 dark:text-zinc-300 transition-colors"
                          >
                            {area.name}, {area.administrative_division_level_2_name}, {area.administrative_division_level_1_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <input type="hidden" name="biteship_area_id" value={biteshipAreaId} />
                <input type="hidden" name="biteship_area_name" value={biteshipAreaName} />
                <InputError message={errors.biteship_area_id} />
              </div>
            </div>
            <SheetFooter className="p-6 border-t bg-background mt-auto flex-row gap-2 sm:justify-end">
              <Button type="submit" disabled={processing} className="flex-1 sm:flex-none rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                {processing ? 'Menyimpan...' : 'Perbarui Pelanggan'}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="outline" className="flex-1 sm:flex-none rounded-xl">Batal</Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet Detail Pelanggan */}
      <Sheet
        open={isSheetOpenDetail}
        onOpenChange={(open) => {
          setIsSheetOpenDetail(open);
          if (!open) setSelectedCustomer(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Detail Rincian Pelanggan
            </SheetTitle>
            <SheetDescription>Profil loyalitas pelanggan dan alamat lengkap pengiriman.</SheetDescription>
          </SheetHeader>
          
          {selectedCustomer && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profil Identitas */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                    {selectedCustomer.name[0].toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{selectedCustomer.name}</h3>
                    {selectedCustomer.username && (
                      <p className="text-sm text-zinc-500">Username: <span className="font-medium text-zinc-700 dark:text-zinc-300">@{selectedCustomer.username}</span></p>
                    )}
                    <Badge className="capitalize rounded-full font-medium text-[10px] mt-1">Platform: {selectedCustomer.platform}</Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

              {/* Rincian Transaksi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Total Order</span>
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1 block">{selectedCustomer.transactions_count || 0}</span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">Total Belanja</span>
                  <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1 block">{formatIDR(selectedCustomer.transactions_sum_grand_total)}</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

              {/* Alamat Pengiriman */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Alamat Pengiriman Utama
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[80px]">
                  {selectedCustomer.address ? (
                    selectedCustomer.address
                  ) : (
                    <span className="text-zinc-400 italic">Alamat pengiriman belum dicatat.</span>
                  )}
                </div>
              </div>

              {/* Wilayah Pengiriman Biteship */}
              {selectedCustomer.biteship_area_name && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    Wilayah Kecamatan/Kelurahan
                  </h4>
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    {selectedCustomer.biteship_area_name}
                  </div>
                </div>
              )}

              {/* Kontak */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Kontak Pelanggan
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 text-sm text-zinc-700 dark:text-zinc-300">
                  {selectedCustomer.phone ? (
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCustomer.phone}</span>
                  ) : (
                    <span className="text-zinc-400 italic">Nomor telepon belum dicatat.</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <SheetFooter className="p-6 border-t mt-auto">
            <SheetClose asChild>
              <Button type="button" variant="secondary" className="w-full rounded-xl">Tutup</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

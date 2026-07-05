import { Head, useForm } from '@inertiajs/react';
import { BookOpen, MapPin, Phone, Plus, Text, User } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Producer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  total_unpaid_debt: number; // Dihitung dinamis dari backend map()
}

interface Props {
  producers: Producer[];
}

export default function Producers({ producers }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper Formatter Rupiah
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Inertia Form untuk menambahkan master produsen baru
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/finance/producers', {
      onSuccess: () => {
        setIsOpen(false);
        reset();
      },
    });
  };

  // Hitung total hutang global ke seluruh produsen
  const globalTotalDebt = producers.reduce((acc, curr) => acc + curr.total_unpaid_debt, 0);

  return (
    <>
      <Head title="Master Data Produsen" />
      <div className="flex flex-col gap-4 p-4">

        {/* HEADER & ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Heading
            title="Mitra & Produsen Konveksi"
            description="Kelola daftar master data produsen supplier beserta buku kartu hutang berjalannya."
          />

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 self-start sm:self-auto shadow-sm">
                <Plus className="h-4 w-4" /> Tambah Produsen
              </Button>
            </SheetTrigger>

            {/* SHEET POP-UP FORM TAMBAH MASTER PRODUSEN */}
            <SheetContent className="flex flex-col h-full sm:max-w-md p-0 gap-0">
              <SheetHeader className="p-6 border-b bg-background">
                <SheetTitle>Tambah Master Produsen</SheetTitle>
                <SheetDescription>Daftarkan produsen atau konveksi baru untuk mempermudah pencatatan nota berkala.</SheetDescription>
              </SheetHeader>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Produsen / Konveksi</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Contoh: Konveksi Hijab Bandung"
                      className="pl-9 h-9 text-xs"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                    />
                  </div>
                  <InputError message={errors.name} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">No. Telepon / WhatsApp (Opsional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Contoh: 08123456789"
                      className="pl-9 h-9 text-xs"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                    />
                  </div>
                  <InputError message={errors.phone} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Alamat Workshop / Gudang (Opsional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="address"
                      rows={2}
                      placeholder="Masukkan alamat lengkap produsen..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={data.address}
                      onChange={(e) => setData('address', e.target.value)}
                    />
                  </div>
                  <InputError message={errors.address} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Catatan Kerja Sama (Opsional)</Label>
                  <div className="relative">
                    <Text className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="notes"
                      rows={2}
                      placeholder="Contoh: Sistem pembayaran tempo tiap hari Sabtu sore..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                    />
                  </div>
                  <InputError message={errors.notes} />
                </div>

                <SheetFooter className="pt-4 border-t flex-row gap-2 justify-end">
                  <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    {processing ? 'Menyimpan...' : 'Simpan Master Produsen'}
                  </Button>
                  <SheetClose asChild><Button variant="outline" type="button" className="text-xs">Batal</Button></SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* WIDGET TOTAL HUTANG KESELURUHAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Total Hutang (Semua Produsen)</p>
                <h3 className="text-xl font-black text-amber-600 tracking-tight">{formatIDR(globalTotalDebt)}</h3>
              </div>
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABEL DATA UTAMA MASTER PRODUSEN */}
        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-3">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Nama Produsen / Konveksi</TableHead>
                  <TableHead className="w-[150px]">No. Telepon / WA</TableHead>
                  <TableHead>Alamat Gudang</TableHead>
                  <TableHead>Ket. Sistem Kerja Sama</TableHead>
                  <TableHead className="w-[180px] text-right">Sisa Hutang Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {producers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground text-sm">
                      Belum ada master data produsen. Klik tombol "Tambah Produsen" untuk meregistrasikan.
                    </TableCell>
                  </TableRow>
                ) : (
                  producers.map((prod) => (
                    <TableRow key={prod.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="text-xs font-bold text-foreground py-3">
                        🏢 {prod.name}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {prod.phone || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {prod.address || '-'}
                      </TableCell>
                      <TableCell className="text-xs italic text-muted-foreground max-w-[220px] truncate">
                        {prod.notes || '-'}
                      </TableCell>
                      <TableCell className={`text-right text-xs font-extrabold ${prod.total_unpaid_debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {prod.total_unpaid_debt > 0 ? formatIDR(prod.total_unpaid_debt) : 'Lunas ✅'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </>
  );
}

Producers.layout = {
  breadcrumbs: [
    { title: 'Master Data', href: '#' },
    { title: 'Master Produsen', href: '/finance/producers' },
  ],
};
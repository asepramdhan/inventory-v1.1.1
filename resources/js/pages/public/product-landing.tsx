import { Head } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Box, Check, MessageCircle, AlertTriangle, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface ProductProps {
    product: {
        id: number;
        sku: string;
        name: string;
        price: string;
        stock: number;
        image: string | null;
        description: string | null;
        landing_description: string | null;
        whatsapp_number: string | null;
        whatsapp_message_template: string | null;
        category?: {
            name: string;
        };
    };
}

export default function ProductLanding({ product }: ProductProps) {
    const priceNum = parseFloat(product.price);
    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(priceNum);

    const activeDescription = product.landing_description || product.description || 'Tidak ada deskripsi detail untuk produk ini.';
    const isOutOfStock = product.stock <= 0;

    // Helper formatting WhatsApp number
    const formatWhatsAppNumber = (num: string | null) => {
        if (!num) return '';
        let cleaned = num.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.slice(1);
        }
        return cleaned;
    };

    const targetPhone = formatWhatsAppNumber(product.whatsapp_number || '628123456789'); // fallback default number if none specified

    // Build template message
    const buildMessage = () => {
        if (product.whatsapp_message_template) {
            return product.whatsapp_message_template
                .replace('{product_name}', product.name)
                .replace('{sku}', product.sku)
                .replace('{price}', formattedPrice);
        }
        return `Halo, saya tertarik untuk membeli produk berikut:\n\n*Nama Produk:* ${product.name}\n*SKU:* ${product.sku}\n*Harga:* ${formattedPrice}\n\nApakah produk ini masih tersedia? Terima kasih.`;
    };

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(buildMessage())}`;

    return (
        <>
            <Head title={`${product.name} - Pesan Online`} />

            <div className="min-h-screen bg-zinc-55 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 antialiased scroll-smooth relative overflow-hidden pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-10 px-4 md:px-8">
                {/* Background ambient mesh */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.05),transparent_40%)] blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

                {/* Header Logo */}
                <div className="max-w-5xl mx-auto flex items-center justify-between pb-8 border-b border-zinc-200/55 dark:border-zinc-900/60 mb-10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-900 text-white border border-zinc-800">
                            <AppLogoIcon className="size-5 fill-current" />
                        </div>
                        <span className="font-extrabold text-base tracking-tight">Storefront Catalog</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 border-emerald-500/20 bg-emerald-55/10">
                        Official Store verified
                    </Badge>
                </div>

                {/* Main Content Layout */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                    {/* Left Column: Image preview */}
                    <div className="space-y-4">
                        <Card className="overflow-hidden border border-zinc-200/60 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-md rounded-3xl shadow-xl">
                            <CardContent className="p-2">
                                {product.image ? (
                                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transform hover:scale-102 transition-transform duration-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-square w-full rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800">
                                        <Box className="size-16 stroke-1 mb-2 text-zinc-300 dark:text-zinc-700" />
                                        <span className="text-xs">No Image Available</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Badges / Extra trust parameters */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-900 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm text-center">
                                <ShieldCheck className="size-5 mx-auto text-indigo-500 mb-1.5" />
                                <span className="text-[10px] font-bold block text-muted-foreground">Original 100%</span>
                            </div>
                            <div className="p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-900 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm text-center">
                                <Truck className="size-5 mx-auto text-indigo-500 mb-1.5" />
                                <span className="text-[10px] font-bold block text-muted-foreground">Pengiriman Cepat</span>
                            </div>
                            <div className="p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-900 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-sm text-center">
                                <RotateCcw className="size-5 mx-auto text-indigo-500 mb-1.5" />
                                <span className="text-[10px] font-bold block text-muted-foreground">Garansi Retur</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & WhatsApp Action */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {product.category && (
                                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/10 rounded-full px-3 py-0.5 text-xs font-semibold">
                                    {product.category.name}
                                </Badge>
                            )}

                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                                <span>SKU: {product.sku}</span>
                                <span>•</span>
                                <span className={isOutOfStock ? 'text-red-500' : 'text-emerald-500'}>
                                    {isOutOfStock ? 'Stok Habis' : 'Stok Tersedia'}
                                </span>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="p-5 rounded-3xl bg-zinc-900 dark:bg-zinc-900/90 border border-zinc-800 text-white space-y-2.5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                            <p className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Harga Spesial</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                                    {formattedPrice}
                                </span>
                            </div>
                        </div>

                        {/* Action CTA Box */}
                        <div className="space-y-3">
                            <Button
                                asChild
                                disabled={isOutOfStock}
                                className="w-full py-6 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 group border-none"
                            >
                                <a href={isOutOfStock ? '#' : whatsappUrl} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="size-4 group-hover:scale-110 transition-transform" />
                                    Beli Sekarang via WhatsApp
                                </a>
                            </Button>

                            <p className="text-[11px] text-muted-foreground text-center">
                                Klik tombol di atas untuk berdiskusi & menyelesaikan transaksi langsung melalui WhatsApp resmi kami secara aman.
                            </p>
                        </div>

                        {/* Detailed Description */}
                        <div className="border-t border-zinc-200/60 dark:border-zinc-800/80 pt-6 space-y-3">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Detail Informasi Produk</h3>
                            <div className="text-zinc-650 dark:text-zinc-350 text-sm leading-relaxed whitespace-pre-wrap">
                                {activeDescription}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer disclaimer */}
                <div className="max-w-5xl mx-auto mt-20 pt-8 border-t border-zinc-200/55 dark:border-zinc-900/60 text-center text-xs text-muted-foreground">
                    <p>&copy; 2026 Storefront Catalog. All rights reserved. Hubungi admin toko kami jika Anda memerlukan bantuan.</p>
                </div>
            </div>
        </>
    );
}

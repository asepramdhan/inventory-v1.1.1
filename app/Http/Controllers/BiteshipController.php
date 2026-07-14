<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BiteshipController extends Controller
{
    protected BiteshipService $biteship;

    public function __construct(BiteshipService $biteship)
    {
        $this->biteship = $biteship;
    }

    /**
     * Search areas
     */
    public function searchAreas(Request $request)
    {
        $query = $request->query('query', '');
        if (strlen($query) < 3) {
            return response()->json(['areas' => []]);
        }

        $result = $this->biteship->searchAreas($query);
        return response()->json($result);
    }

    /**
     * Get rates for items
     */
    public function getRates(Request $request)
    {
        $request->validate([
            'destination_area_id' => 'required|string',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $destinationArea = $request->input('destination_area_id');
        $inputItems = $request->input('items');

        $originArea = env('BITESHIP_ORIGIN_AREA_ID', 'IDNP3174011001'); // Kebayoran Lama default

        $biteshipItems = [];
        $userId = Auth::id();

        foreach ($inputItems as $item) {
            $product = Product::where('user_id', $userId)->find($item['product_id']);
            if (!$product) continue;

            $weight = $product->weight > 0 ? $product->weight : 200; // Fallback 200g
            $biteshipItems[] = [
                'name' => $product->name,
                'value' => (int) $product->price,
                'weight' => $weight,
                'quantity' => (int) $item['quantity']
            ];
        }

        if (empty($biteshipItems)) {
            return response()->json(['error' => 'No valid products found'], 422);
        }

        $ratesData = $this->biteship->getRates($originArea, $destinationArea, $biteshipItems);

        if (!$ratesData || !isset($ratesData['success']) || !$ratesData['success']) {
            return response()->json(['error' => 'Gagal mendapatkan tarif ongkir dari Biteship'], 500);
        }

        return response()->json($ratesData);
    }

    /**
     * Book shipment / Request Pickup
     */
    public function bookShipment(Request $request, $id)
    {
        $userId = Auth::id();
        $transaction = Transaction::where('user_id', $userId)->with(['customer', 'items.product'])->findOrFail($id);

        if ($transaction->platform !== 'manual') {
            return response()->json(['error' => 'Hanya transaksi manual / WA yang bisa diatur pengirimannya.'], 400);
        }

        $customer = $transaction->customer;
        if (!$customer || empty($customer->biteship_area_id)) {
            return response()->json(['error' => 'Pelanggan tidak memiliki Area ID Biteship. Harap atur kelurahan/kecamatan pelanggan terlebih dahulu.'], 400);
        }

        $request->validate([
            'courier_company' => 'required|string',
            'courier_type' => 'required|string',
            'shipping_cost' => 'required|numeric',
        ]);

        $courierCompany = $request->input('courier_company');
        $courierType = $request->input('courier_type');
        $shippingCost = $request->input('shipping_cost');

        // Compile items
        $biteshipItems = [];
        foreach ($transaction->items as $item) {
            $product = $item->product;
            $weight = ($product && $product->weight > 0) ? $product->weight : 200;
            $biteshipItems[] = [
                'name' => $item->product_name ?? ($product ? $product->name : 'Barang Toko'),
                'value' => (int) $item->selling_price,
                'weight' => $weight,
                'quantity' => (int) $item->quantity
            ];
        }

        if (empty($biteshipItems)) {
            return response()->json(['error' => 'Transaksi tidak memiliki produk.'], 400);
        }

        // Load shipper/origin details from config/env
        $senderName = env('BITESHIP_SENDER_NAME', 'Toko Saya');
        $senderPhone = env('BITESHIP_SENDER_PHONE', '08123456789');
        $senderAddress = env('BITESHIP_SENDER_ADDRESS', 'Alamat Toko Utama');
        $originArea = env('BITESHIP_ORIGIN_AREA_ID', 'IDNP3174011001');

        $payload = [
            'shipper_contact_name' => $senderName,
            'shipper_contact_phone' => $senderPhone,
            'origin_contact_name' => $senderName,
            'origin_contact_phone' => $senderPhone,
            'origin_address' => $senderAddress,
            'origin_area_id' => $originArea,
            
            'destination_contact_name' => $customer->name,
            'destination_contact_phone' => $customer->phone ?? '081234567890',
            'destination_address' => $customer->address ?? 'Alamat Pelanggan',
            'destination_area_id' => $customer->biteship_area_id,
            
            'courier_company' => $courierCompany,
            'courier_type' => $courierType,
            'delivery_type' => 'now',
            'items' => $biteshipItems
        ];

        $orderData = $this->biteship->createOrder($payload);

        if (!$orderData || !isset($orderData['success']) || !$orderData['success']) {
            $msg = $orderData['error'] ?? 'Gagal membuat order pengiriman di Biteship.';
            return response()->json(['error' => $msg], 500);
        }

        // Save order details to transaction
        $transaction->courier_name = $courierCompany;
        $transaction->courier_service = $courierType;
        $transaction->shipping_cost = $shippingCost;
        
        // Biteship response fields
        $transaction->biteship_order_id = $orderData['id'] ?? null;
        $transaction->waybill_number = $orderData['courier']['waybill_id'] ?? null;
        $transaction->shipping_status = $orderData['status'] ?? 'allocated';
        
        // Biteship returns courier.tracking_url or public tracking url
        $transaction->shipping_label_url = $orderData['courier']['tracking_url'] ?? null;

        // Automatically update transaction status to processing
        $transaction->status = 'processing';
        
        // Recalculate grand_total to include shipping cost
        $transaction->grand_total = ($transaction->subtotal - $transaction->discount) + $shippingCost;
        $transaction->save();

        return response()->json([
            'success' => true,
            'transaction' => $transaction,
            'message' => 'Pemesanan kurir berhasil! Nomor Resi: ' . ($transaction->waybill_number ?: 'Sedang diproses.')
        ]);
    }

    /**
     * Get tracking status
     */
    public function trackShipment(Request $request, $id)
    {
        $userId = Auth::id();
        $transaction = Transaction::where('user_id', $userId)->findOrFail($id);

        if (empty($transaction->waybill_number) || empty($transaction->courier_name)) {
            return response()->json(['error' => 'Transaksi belum memiliki nomor resi pengiriman.'], 400);
        }

        $trackData = $this->biteship->trackShipment($transaction->waybill_number, $transaction->courier_name);

        if (!$trackData || !isset($trackData['success']) || !$trackData['success']) {
            return response()->json(['error' => 'Gagal mengambil data pelacakan dari Biteship.'], 500);
        }

        // Optional: Update local shipping_status if changed
        if (isset($trackData['status'])) {
            $transaction->shipping_status = $trackData['status'];
            
            // If delivered, mark completed
            if ($trackData['status'] === 'delivered' && $transaction->status !== 'completed') {
                $transaction->status = 'completed';
            }
            
            $transaction->save();
        }

        return response()->json($trackData);
    }
}

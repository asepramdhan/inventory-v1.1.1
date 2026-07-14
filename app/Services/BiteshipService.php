<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BiteshipService
{
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = env('BITESHIP_API_KEY', '');
        $this->baseUrl = 'https://api.biteship.com';
    }

    /**
     * Helper to make authenticated requests
     */
    protected function request()
    {
        return Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Search areas (subdistrict/city/province)
     */
    public function searchAreas(string $query)
    {
        try {
            $response = $this->request()->get("{$this->baseUrl}/v1/maps/areas", [
                'countries' => 'ID',
                'input' => $query
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Biteship searchAreas failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return ['areas' => []];
        } catch (\Exception $e) {
            Log::error('Biteship searchAreas exception', ['message' => $e->getMessage()]);
            return ['areas' => []];
        }
    }

    /**
     * Calculate shipping rates
     */
    public function getRates(string $originArea, string $destinationArea, array $items)
    {
        try {
            $payload = [
                'origin_area_id' => $originArea,
                'destination_area_id' => $destinationArea,
                'items' => $items
            ];

            $response = $this->request()->post("{$this->baseUrl}/v1/rates/couriers", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Biteship getRates failed', [
                'payload' => $payload,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Biteship getRates exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create shipment / booking
     */
    public function createOrder(array $payload)
    {
        try {
            $response = $this->request()->post("{$this->baseUrl}/v1/orders", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Biteship createOrder failed', [
                'payload' => $payload,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Biteship createOrder exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Track shipment waybill
     */
    public function trackShipment(string $waybill, string $courierCode)
    {
        try {
            $response = $this->request()->get("{$this->baseUrl}/v1/trackings/{$waybill}/couriers/{$courierCode}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Biteship trackShipment failed', [
                'waybill' => $waybill,
                'courier' => $courierCode,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Biteship trackShipment exception', ['message' => $e->getMessage()]);
            return null;
        }
    }
}

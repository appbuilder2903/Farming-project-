'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Market } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Next.js
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MarketMapProps {
  markets: Market[];
  center: [number, number];
}

export default function MarketMap({ markets, center }: MarketMapProps) {
  useEffect(() => {
    // Ensure Leaflet runs only on client
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* User location marker */}
      <Marker position={center} icon={markerIcon}>
        <Popup>Your Location</Popup>
      </Marker>
      {/* Market markers */}
      {markets.map((market) => (
        <Marker
          key={market._id}
          position={[
            market.location.coordinates[1],
            market.location.coordinates[0],
          ]}
          icon={markerIcon}
        >
          <Popup>
            <strong>{market.name}</strong>
            <br />
            {market.district}, {market.state}
            {market.distance !== undefined && (
              <>
                <br />
                {market.distance.toFixed(1)} km away
              </>
            )}
            {market.contact && (
              <>
                <br />
                📞 {market.contact}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

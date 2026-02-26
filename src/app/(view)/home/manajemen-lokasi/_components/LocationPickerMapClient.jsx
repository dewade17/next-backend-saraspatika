'use client';

import React from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const DEFAULT_CENTER = [-8.409518, 115.188919];
const DEFAULT_ZOOM = 10;
const SELECTED_ZOOM = 17;

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapViewportController({ latitude, longitude, zoom }) {
  const map = useMap();
  const hasMountedRef = React.useRef(false);

  React.useEffect(() => {
    const targetLat = Number(latitude);
    const targetLng = Number(longitude);
    const targetZoom = Number(zoom);
    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng) || !Number.isFinite(targetZoom)) return;

    const center = map.getCenter();
    const currentZoom = map.getZoom();
    const hasMoved =
      Math.abs(center.lat - targetLat) > 0.0000001 ||
      Math.abs(center.lng - targetLng) > 0.0000001 ||
      currentZoom !== targetZoom;

    if (!hasMoved) return;

    map.setView([targetLat, targetLng], targetZoom, { animate: hasMountedRef.current });
    hasMountedRef.current = true;
  }, [map, latitude, longitude, zoom]);

  return null;
}

function MapResizeController() {
  const map = useMap();

  React.useEffect(() => {
    const invalidate = () => map.invalidateSize({ pan: false, animate: false });
    invalidate();

    const timeout = window.setTimeout(invalidate, 120);
    const container = map.getContainer();
    let observer;

    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => invalidate());
      observer.observe(container);
    }

    return () => {
      window.clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

export default function LocationPickerMapClient({ latitude, longitude, onPick, height = 320 }) {
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const center = hasCoords ? [latitude, longitude] : DEFAULT_CENTER;
  const zoom = hasCoords ? SELECTED_ZOOM : DEFAULT_ZOOM;

  return (
    <div style={{ width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        preferCanvas
        scrollWheelZoom
        style={{ width: '100%', height }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        <MapClickHandler onPick={onPick} />
        <MapViewportController
          latitude={center[0]}
          longitude={center[1]}
          zoom={zoom}
        />
        <MapResizeController />

        {hasCoords ? (
          <CircleMarker
            center={[latitude, longitude]}
            radius={9}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#1677ff',
              fillOpacity: 1,
              weight: 3,
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import styles from './MapEmbed.module.css';

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function MapEmbed({ lat, lng, title }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !mapRef.current) return;
    initialized.current = true;

    // Dynamically load Leaflet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker
      const icon = L.divIcon({
        html: `<div class="map-marker-pin">📍</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${title}</strong>`)
        .openPopup();
    };
    document.head.appendChild(script);

    return () => {
      // cleanup on unmount (not critical for SSR pages)
    };
  }, [lat, lng, title]);

  return (
    <div className={styles.wrapper}>
      <div ref={mapRef} className={styles.map} />
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className={styles.gmapsLink}
      >
        Open in Google Maps ↗
      </a>
    </div>
  );
}

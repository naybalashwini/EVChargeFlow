import { useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { ChargingStation } from '../types';
import { getStationAvailability } from '../lib/calculations';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  stations: ChargingStation[];
  selectedStationId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  routeGeometry?: GeoJSON.LineString | null;
  originPoint?: { lat: number; lng: number } | null;
  destinationPoint?: { lat: number; lng: number } | null;
  chargingStops?: Array<{ lat: number; lng: number }>;
  onStationClick?: (station: ChargingStation) => void;
  onMapClick?: () => void;
  className?: string;
}

export default function MapView({
  center = [75.3433, 19.8762],
  zoom = 13,
  stations,
  selectedStationId,
  userLocation,
  routeGeometry,
  originPoint,
  destinationPoint,
  chargingStops,
  onStationClick,
  onMapClick,
  className = '',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('click', () => {
      onMapClick?.();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({ center, zoom: Math.max(map.current.getZoom(), 12), duration: 1000 });
    }
  }, [center]);

  // Update station markers
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers
    stations.forEach((station) => {
      const availability = getStationAvailability(station);
      const isSelected = station.id === selectedStationId;

      const el = document.createElement('div');
      el.className = `charging-marker ${isSelected ? 'selected' : availability}`;
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      el.setAttribute('aria-label', `${station.name} - ${availability}`);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onStationClick?.(station);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map.current!);

      markersRef.current.set(station.id, marker);
    });
  }, [stations, selectedStationId, onStationClick]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Fly to selected station
  useEffect(() => {
    if (!map.current || !selectedStationId) return;
    const station = stations.find(s => s.id === selectedStationId);
    if (station) {
      map.current.flyTo({
        center: [station.longitude, station.latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [selectedStationId, stations]);

  // User location marker
  useEffect(() => {
    if (!map.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'origin-marker';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.background = '#4ade80';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 12px rgba(74, 222, 128, 0.6)';

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation]);

  // Route geometry
  useEffect(() => {
    if (!map.current) return;

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: routeGeometry ? [{
          type: 'Feature',
          properties: {},
          geometry: routeGeometry,
        }] : [],
      });
    } else if (routeGeometry) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: routeGeometry,
          }],
        },
      });

      map.current.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#4ade80',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }
  }, [routeGeometry]);

  // Origin/Destination/Stop markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    originMarkerRef.current?.remove();
    destMarkerRef.current?.remove();
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    if (originPoint) {
      const el = document.createElement('div');
      el.className = 'origin-marker';
      originMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([originPoint.lng, originPoint.lat])
        .addTo(map.current);
    }

    if (destinationPoint) {
      const el = document.createElement('div');
      el.className = 'destination-marker';
      destMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([destinationPoint.lng, destinationPoint.lat])
        .addTo(map.current);
    }

    if (chargingStops) {
      chargingStops.forEach(stop => {
        const el = document.createElement('div');
        el.className = 'stop-marker';
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map.current!);
        stopMarkersRef.current.push(marker);
      });
    }
  }, [originPoint, destinationPoint, chargingStops]);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} style={{ minHeight: '300px' }} />
  );
}

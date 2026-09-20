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
  const mapReadyRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: center,
      zoom: zoom,
      attributionControl: false,
      pitchWithRotate: false,
      maxPitch: 0,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 150, unit: 'metric' }), 'bottom-left');

    map.current.on('load', () => {
      mapReadyRef.current = true;
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    map.current.on('click', () => {
      onMapClick?.();
    });

    return () => {
      map.current?.remove();
      map.current = null;
      mapReadyRef.current = false;
    };
  }, []);

  // Update center (only when no route)
  useEffect(() => {
    if (map.current && center && !routeGeometry) {
      map.current.flyTo({ center, zoom: Math.max(map.current.getZoom(), 12), duration: 1000 });
    }
  }, [center, routeGeometry]);

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

      // Create popup
      const popup = new maplibregl.Popup({ 
        offset: 25, 
        closeButton: false,
        className: 'station-popup'
      }).setHTML(`
        <div class="popup-inner">
          <div class="popup-name">${station.name}</div>
          <div class="popup-operator">${station.operator}</div>
          <div class="popup-power">⚡ ${station.power} kW • ${station.connectors.join(', ')}</div>
          <div class="popup-info">${station.availableChargers}/${station.totalChargers} available${station.pricePerKwh ? ` • ₹${station.pricePerKwh}/kWh` : ''}</div>
        </div>
      `);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onStationClick?.(station);
      });

      el.addEventListener('mouseenter', () => {
        popup.setLngLat([station.longitude, station.latitude]).addTo(map.current!);
      });

      el.addEventListener('mouseleave', () => {
        popup.remove();
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
    if (!map.current || !selectedStationId || routeGeometry) return;
    const station = stations.find(s => s.id === selectedStationId);
    if (station) {
      map.current.flyTo({
        center: [station.longitude, station.latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [selectedStationId, stations, routeGeometry]);

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

  // Route geometry - with proper styling
  useEffect(() => {
    if (!map.current || !mapReadyRef.current) return;

    const mapInstance = map.current;

    // Remove existing route layers and source
    if (mapInstance.getLayer('route-casing')) mapInstance.removeLayer('route-casing');
    if (mapInstance.getLayer('route-layer')) mapInstance.removeLayer('route-layer');
    if (mapInstance.getSource('route')) mapInstance.removeSource('route');

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
      // Add route source
      mapInstance.addSource('route', {
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

      // Find a good layer to insert route before (below labels, above roads)
      const layers = mapInstance.getStyle().layers;
      let labelLayerId = '';
      for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          labelLayerId = layer.id;
          break;
        }
      }

      // Add route casing (dark outline for visibility)
      mapInstance.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#064e3b',
          'line-width': 10,
          'line-opacity': 0.9,
        },
      }, labelLayerId || undefined);

      // Add main route line
      mapInstance.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#4ade80',
          'line-width': 6,
          'line-opacity': 1,
        },
      }, labelLayerId || undefined);

      // Fit map to route bounds
      try {
        const coords = routeGeometry.coordinates;
        const bounds = new maplibregl.LngLatBounds();
        coords.forEach((coord: number[]) => {
          bounds.extend([coord[0], coord[1]]);
        });
        
        // Add origin and destination to bounds
        if (originPoint) bounds.extend([originPoint.lng, originPoint.lat]);
        if (destinationPoint) bounds.extend([destinationPoint.lng, destinationPoint.lat]);
        if (chargingStops) {
          chargingStops.forEach(stop => bounds.extend([stop.lng, stop.lat]));
        }

        mapInstance.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 1200,
          maxZoom: 14,
        });
      } catch (e) {
        console.warn('Could not fit bounds:', e);
      }
    }
  }, [routeGeometry, originPoint, destinationPoint, chargingStops]);

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
      el.title = 'Start';
      originMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([originPoint.lng, originPoint.lat])
        .addTo(map.current);
    }

    if (destinationPoint) {
      const el = document.createElement('div');
      el.className = 'destination-marker';
      el.title = 'Destination';
      destMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([destinationPoint.lng, destinationPoint.lat])
        .addTo(map.current);
    }

    if (chargingStops) {
      chargingStops.forEach((stop, idx) => {
        const el = document.createElement('div');
        el.className = 'stop-marker';
        el.title = `Charging Stop ${idx + 1}`;
        el.style.position = 'relative';
        el.innerHTML = `<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;font-weight:bold;color:white;">${idx + 1}</span>`;
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

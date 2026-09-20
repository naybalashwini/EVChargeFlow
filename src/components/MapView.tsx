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

  // Initialize map with Google Maps-like style
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Using Positron - the cleanest, most Google Maps-like free style
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
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

      // Google Maps-style charging pin
      const el = document.createElement('div');
      el.className = `gm-marker ${isSelected ? 'selected' : availability}`;
      el.innerHTML = `
        <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" 
                fill="${isSelected ? '#1a73e8' : availability === 'available' ? '#34a853' : availability === 'limited' ? '#f9ab00' : '#ea4335'}"/>
          <circle cx="15" cy="14" r="8" fill="white"/>
          <path d="M17 8l-5 7h3.5l-1 5 5-7h-3.5l1-5z" fill="${isSelected ? '#1a73e8' : '#34a853'}"/>
        </svg>
      `;
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.15s ease';
      el.setAttribute('aria-label', `${station.name} - ${availability}`);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15) translateY(-2px)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });

      // Create Google Maps-style popup
      const popup = new maplibregl.Popup({ 
        offset: [0, -30], 
        closeButton: false,
        className: 'gm-popup'
      }).setHTML(`
        <div class="gm-popup-content">
          <div class="gm-popup-name">${station.name}</div>
          <div class="gm-popup-sub">${station.operator}</div>
          <div class="gm-popup-row">
            <span class="gm-popup-label">Power</span>
            <span class="gm-popup-value">${station.power} kW</span>
          </div>
          <div class="gm-popup-row">
            <span class="gm-popup-label">Connectors</span>
            <span class="gm-popup-value">${station.connectors.join(', ')}</span>
          </div>
          <div class="gm-popup-row">
            <span class="gm-popup-label">Available</span>
            <span class="gm-popup-value">${station.availableChargers}/${station.totalChargers}</span>
          </div>
          ${station.pricePerKwh ? `
          <div class="gm-popup-row">
            <span class="gm-popup-label">Price</span>
            <span class="gm-popup-value">₹${station.pricePerKwh}/kWh</span>
          </div>` : ''}
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

  // User location marker (Google blue dot)
  useEffect(() => {
    if (!map.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'gm-user-location';
      el.innerHTML = `
        <div class="gm-user-dot"></div>
        <div class="gm-user-pulse"></div>
      `;

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation]);

  // Route geometry - Google Maps blue route style
  useEffect(() => {
    if (!map.current || !mapReadyRef.current) return;

    const mapInstance = map.current;

    // Remove existing route layers and source
    if (mapInstance.getLayer('route-outline')) mapInstance.removeLayer('route-outline');
    if (mapInstance.getLayer('route-layer')) mapInstance.removeLayer('route-layer');
    if (mapInstance.getSource('route')) mapInstance.removeSource('route');

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
      // Add route source
      const routeGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: routeGeometry,
        }],
      };
      const sourceSpec = {
        type: 'geojson' as const,
      };
      (sourceSpec as any)['data'] = routeGeoJSON;
      mapInstance.addSource('route', sourceSpec as maplibregl.GeoJSONSourceSpecification);

      // Find label layer to insert route below
      const layers = mapInstance.getStyle().layers;
      let labelLayerId = '';
      for (const layer of layers) {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          labelLayerId = layer.id;
          break;
        }
      }

      // Google Maps-style route: dark blue outline + lighter blue fill
      // Outline (darker border for visibility)
      mapInstance.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#1a73e8',
          'line-width': 10,
          'line-opacity': 0.4,
        },
      }, labelLayerId || undefined);

      // Main route line (Google blue)
      mapInstance.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#4285f4',
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
        
        if (originPoint) bounds.extend([originPoint.lng, originPoint.lat]);
        if (destinationPoint) bounds.extend([destinationPoint.lng, destinationPoint.lat]);
        if (chargingStops) {
          chargingStops.forEach(stop => bounds.extend([stop.lng, stop.lat]));
        }

        mapInstance.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 1200,
          maxZoom: 13,
        });
      } catch (e) {
        console.warn('Could not fit bounds:', e);
      }
    }
  }, [routeGeometry, originPoint, destinationPoint, chargingStops]);

  // Origin/Destination/Stop markers - Google Maps style
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    originMarkerRef.current?.remove();
    destMarkerRef.current?.remove();
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    if (originPoint) {
      const el = document.createElement('div');
      el.className = 'gm-pin gm-pin-green';
      el.innerHTML = `
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#34a853"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
          <circle cx="12" cy="12" r="3" fill="#34a853"/>
        </svg>
      `;
      el.title = 'Start';
      originMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([originPoint.lng, originPoint.lat])
        .addTo(map.current);
    }

    if (destinationPoint) {
      const el = document.createElement('div');
      el.className = 'gm-pin gm-pin-red';
      el.innerHTML = `
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#ea4335"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
          <circle cx="12" cy="12" r="3" fill="#ea4335"/>
        </svg>
      `;
      el.title = 'Destination';
      destMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([destinationPoint.lng, destinationPoint.lat])
        .addTo(map.current);
    }

    if (chargingStops) {
      chargingStops.forEach((stop, idx) => {
        const el = document.createElement('div');
        el.className = 'gm-pin gm-pin-blue';
        el.innerHTML = `
          <svg width="28" height="40" viewBox="0 0 28 40" fill="none">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#1a73e8"/>
            <circle cx="14" cy="14" r="8" fill="white"/>
            <text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a73e8" font-family="Arial">${idx + 1}</text>
          </svg>
        `;
        el.title = `Charging Stop ${idx + 1}`;
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

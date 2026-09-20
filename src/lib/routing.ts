import { LocationPoint } from '../types';

const OSRM_URL = 'https://router.project-osrm.org';

export interface RouteResult {
  distance: number; // km
  duration: number; // minutes
  geometry: GeoJSON.LineString;
  coordinates: Array<{ lat: number; lng: number }>;
}

export async function calculateRoute(
  origin: LocationPoint,
  destination: LocationPoint
): Promise<RouteResult> {
  try {
    const url = `${OSRM_URL}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('Routing failed');
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map((c: number[]) => ({
      lat: c[1],
      lng: c[0],
    }));
    
    return {
      distance: route.distance / 1000, // Convert to km
      duration: route.duration / 60, // Convert to minutes
      geometry: route.geometry,
      coordinates,
    };
  } catch (error) {
    console.error('Routing error:', error);
    throw new Error('Route calculation failed. Please try again.');
  }
}

export function createStraightLineGeometry(
  origin: LocationPoint,
  destination: LocationPoint
): GeoJSON.LineString {
  return {
    type: 'LineString',
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
  };
}

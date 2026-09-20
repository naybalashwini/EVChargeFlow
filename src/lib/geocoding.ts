import { LocationPoint } from '../types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export async function searchLocation(query: string): Promise<LocationPoint[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      name: item.display_name.split(',').slice(0, 3).join(',').trim(),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Location search failed. Please try again.');
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) throw new Error('Reverse geocoding failed');
    
    const data = await response.json();
    return data.display_name?.split(',').slice(0, 3).join(',').trim() || 'Current Location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Current Location';
  }
}

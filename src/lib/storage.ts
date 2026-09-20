import { User, VehicleProfile, SavedStation, TripPlan } from '../types';

const KEYS = {
  USER: 'chargeflow_user',
  VEHICLES: 'chargeflow_vehicles',
  SAVED_STATIONS: 'chargeflow_saved',
  TRIPS: 'chargeflow_trips',
};

// User
export function saveUser(user: User): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function getUser(): User | null {
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function removeUser(): void {
  localStorage.removeItem(KEYS.USER);
}

// Vehicles
export function getVehicles(): VehicleProfile[] {
  const data = localStorage.getItem(KEYS.VEHICLES);
  return data ? JSON.parse(data) : [];
}

export function saveVehicle(vehicle: VehicleProfile): void {
  const vehicles = getVehicles();
  const idx = vehicles.findIndex(v => v.id === vehicle.id);
  if (idx >= 0) {
    vehicles[idx] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
}

export function deleteVehicle(id: string): void {
  const vehicles = getVehicles().filter(v => v.id !== id);
  localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
}

// Saved Stations
export function getSavedStations(): SavedStation[] {
  const data = localStorage.getItem(KEYS.SAVED_STATIONS);
  return data ? JSON.parse(data) : [];
}

export function saveStation(saved: SavedStation): void {
  const stations = getSavedStations();
  if (!stations.find(s => s.stationId === saved.stationId)) {
    stations.push(saved);
    localStorage.setItem(KEYS.SAVED_STATIONS, JSON.stringify(stations));
  }
}

export function removeSavedStation(stationId: string): void {
  const stations = getSavedStations().filter(s => s.stationId !== stationId);
  localStorage.setItem(KEYS.SAVED_STATIONS, JSON.stringify(stations));
}

export function isStationSaved(stationId: string): boolean {
  return getSavedStations().some(s => s.stationId === stationId);
}

// Trips
export function getTrips(): TripPlan[] {
  const data = localStorage.getItem(KEYS.TRIPS);
  return data ? JSON.parse(data) : [];
}

export function saveTrip(trip: TripPlan): void {
  const trips = getTrips();
  trips.unshift(trip);
  if (trips.length > 50) trips.pop(); // Keep last 50
  localStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
}

export function deleteTrip(id: string): void {
  const trips = getTrips().filter(t => t.id !== id);
  localStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
}

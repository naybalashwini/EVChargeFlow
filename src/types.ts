export interface ChargingStation {
  id: string;
  name: string;
  operator: string;
  address: string;
  latitude: number;
  longitude: number;
  power: number; // kW
  connectors: ConnectorType[];
  availableChargers: number;
  totalChargers: number;
  pricePerKwh: number | null;
  isOpen24h: boolean;
  openingHours: string;
  rating: number | null;
  lastUpdated: string;
  dataSource: string;
  isDemo: boolean;
}

export type ConnectorType = 'CCS2' | 'Type2' | 'CHAdeMO' | 'Type1' | 'GB/T';

export interface VehicleProfile {
  id: string;
  name: string;
  batteryCapacity: number; // kWh
  consumption: number; // kWh/100km
  connector: ConnectorType;
  maxChargingPower: number; // kW
  targetSoc: number; // %
  minimumArrivalSoc: number; // %
  currentSoc: number; // %
}

export interface TripPlan {
  id: string;
  origin: LocationPoint;
  destination: LocationPoint;
  vehicle: VehicleProfile;
  distance: number; // km
  drivingTime: number; // minutes
  chargingStops: ChargingStop[];
  totalChargingTime: number; // minutes
  estimatedCost: number;
  arrivalSoc: number;
  routeGeometry: GeoJSON.LineString | null;
  createdAt: string;
}

export interface ChargingStop {
  station: ChargingStation;
  sequence: number;
  chargingTime: number; // minutes
  energyAdded: number; // kWh
  estimatedCost: number;
  socOnArrival: number;
  socOnDeparture: number;
}

export interface LocationPoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface FilterState {
  maxDistance: number | null;
  connector: ConnectorType | null;
  minPower: number | null;
  availability: 'available' | 'any';
  openNow: boolean;
}

export type SortOption = 'nearest' | 'fastest' | 'cheapest' | 'availability' | 'rating';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SavedStation {
  id: string;
  stationId: string;
  station: ChargingStation;
  savedAt: string;
}

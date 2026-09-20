import { VehicleProfile, ChargingStation, ChargingStop } from '../types';

export function calculateRange(vehicle: VehicleProfile): number {
  const availableEnergy = vehicle.batteryCapacity * (vehicle.currentSoc / 100);
  return (availableEnergy / vehicle.consumption) * 100;
}

export function calculateEnergyRequired(distanceKm: number, consumption: number): number {
  return (distanceKm * consumption) / 100;
}

export function calculateAvailableEnergy(vehicle: VehicleProfile): number {
  return vehicle.batteryCapacity * (vehicle.currentSoc / 100);
}

export function canReachDestination(
  distance: number,
  vehicle: VehicleProfile
): boolean {
  const range = calculateRange(vehicle);
  return range >= distance;
}

export function calculateChargingTime(
  energyNeeded: number,
  chargingPower: number
): number {
  if (chargingPower <= 0) return 0;
  const hours = energyNeeded / chargingPower;
  return Math.ceil(hours * 60);
}

export function calculateChargingCost(
  energyNeeded: number,
  pricePerKwh: number | null
): number | null {
  if (pricePerKwh === null) return null;
  return Math.round(energyNeeded * pricePerKwh);
}

export function calculateSocAfterCharging(
  vehicle: VehicleProfile,
  energyAdded: number
): number {
  const currentEnergy = vehicle.batteryCapacity * (vehicle.currentSoc / 100);
  const newEnergy = currentEnergy + energyAdded;
  return Math.min(100, (newEnergy / vehicle.batteryCapacity) * 100);
}

export function calculateEnergyForSoc(
  vehicle: VehicleProfile,
  targetSoc: number,
  currentSoc: number
): number {
  const currentEnergy = vehicle.batteryCapacity * (currentSoc / 100);
  const targetEnergy = vehicle.batteryCapacity * (targetSoc / 100);
  return Math.max(0, targetEnergy - currentEnergy);
}

export function calculateDistanceBetween(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isStationCompatible(
  station: ChargingStation,
  vehicle: VehicleProfile
): boolean {
  return station.connectors.includes(vehicle.connector);
}

export function getStationAvailability(station: ChargingStation): 'available' | 'limited' | 'unavailable' {
  if (station.availableChargers === 0) return 'unavailable';
  if (station.availableChargers <= Math.ceil(station.totalChargers * 0.3)) return 'limited';
  return 'available';
}

export function scoreStationForStop(
  station: ChargingStation,
  vehicle: VehicleProfile,
  distanceFromRoute: number,
  requiredEnergy: number
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Connector compatibility (critical)
  if (!isStationCompatible(station, vehicle)) {
    return { score: -1, reasons: ['Incompatible connector'] };
  }
  reasons.push(`✓ Compatible ${vehicle.connector} connector`);
  score += 30;

  // Charging power
  const effectivePower = Math.min(station.power, vehicle.maxChargingPower);
  if (effectivePower >= 100) {
    score += 25;
    reasons.push(`✓ ${effectivePower} kW fast charging`);
  } else if (effectivePower >= 50) {
    score += 15;
    reasons.push(`✓ ${effectivePower} kW charging`);
  } else {
    score += 5;
    reasons.push(`~ ${effectivePower} kW (slow)`);
  }

  // Distance from route
  if (distanceFromRoute <= 2) {
    score += 20;
    reasons.push('✓ Within route corridor');
  } else if (distanceFromRoute <= 5) {
    score += 10;
    reasons.push('~ Slight detour from route');
  } else {
    score += 0;
  }

  // Availability
  if (station.availableChargers >= 2) {
    score += 15;
    reasons.push('✓ Sufficient charging capacity');
  } else if (station.availableChargers === 1) {
    score += 8;
    reasons.push('~ Limited availability');
  } else {
    score -= 20;
  }

  // Open status
  if (station.isOpen24h) {
    score += 10;
    reasons.push('✓ Open 24 hours');
  }

  return { score, reasons };
}

export function planChargingStops(
  distance: number,
  vehicle: VehicleProfile,
  stations: ChargingStation[],
  routePoints: Array<{ lat: number; lng: number }>
): ChargingStop[] {
  const range = calculateRange(vehicle);
  
  if (range >= distance) return [];

  const stops: ChargingStop[] = [];
  let currentSoc = vehicle.currentSoc;
  let remainingDistance = distance;
  let distanceCovered = 0;

  // Sort stations by their position along the route
  const compatibleStations = stations
    .filter(s => isStationCompatible(s, vehicle) && s.availableChargers > 0)
    .map(s => {
      // Find closest route point to estimate position along route
      let minDist = Infinity;
      let routePosition = 0;
      for (let i = 0; i < routePoints.length; i++) {
        const d = calculateDistanceBetween(s.latitude, s.longitude, routePoints[i].lat, routePoints[i].lng);
        if (d < minDist) {
          minDist = d;
          routePosition = (i / routePoints.length) * distance;
        }
      }
      return { station: s, routePosition, distanceFromRoute: minDist };
    })
    .filter(s => s.distanceFromRoute < 10) // Within 10km of route
    .sort((a, b) => a.routePosition - b.routePosition);

  while (remainingDistance > 0) {
    const currentRange = (vehicle.batteryCapacity * (currentSoc / 100) / vehicle.consumption) * 100;
    const safeRange = currentRange * 0.85; // 85% safety margin

    if (safeRange >= remainingDistance) break;

    // Find the best station for the next stop
    const targetPosition = distanceCovered + safeRange * 0.7; // Charge at ~70% of safe range
    
    const candidateStations = compatibleStations
      .filter(s => s.routePosition > distanceCovered && s.routePosition < distanceCovered + safeRange)
      .map(s => ({
        ...s,
        score: scoreStationForStop(s.station, vehicle, s.distanceFromRoute, 0)
      }))
      .filter(s => s.score.score > 0)
      .sort((a, b) => {
        // Prefer stations closest to target position
        const aDist = Math.abs(a.routePosition - targetPosition);
        const bDist = Math.abs(b.routePosition - targetPosition);
        return aDist - bDist || b.score.score - a.score.score;
      });

    if (candidateStations.length === 0) break;

    const bestStation = candidateStations[0];
    const distanceToStation = bestStation.routePosition - distanceCovered;
    const socAtArrival = Math.max(5, currentSoc - (distanceToStation / 100 * vehicle.consumption / vehicle.batteryCapacity * 100));
    
    const targetSocForStop = Math.min(vehicle.targetSoc, 80);
    const energyNeeded = calculateEnergyForSoc(vehicle, targetSocForStop, socAtArrival);
    const effectivePower = Math.min(bestStation.station.power, vehicle.maxChargingPower);
    const chargingTime = calculateChargingTime(energyNeeded, effectivePower);
    const cost = calculateChargingCost(energyNeeded, bestStation.station.pricePerKwh);

    stops.push({
      station: bestStation.station,
      sequence: stops.length + 1,
      chargingTime,
      energyAdded: energyNeeded,
      estimatedCost: cost || 0,
      socOnArrival: Math.round(socAtArrival),
      socOnDeparture: targetSocForStop,
    });

    currentSoc = targetSocForStop;
    distanceCovered = bestStation.routePosition;
    remainingDistance = distance - distanceCovered;

    if (stops.length >= 5) break; // Safety limit
  }

  return stops;
}

export function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins} min`;
  return `${hrs} hr ${mins} min`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

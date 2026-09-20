import { useState, useEffect } from 'react';
import { Route, MapPin, Battery, Zap, Clock, Navigation, Loader2, AlertTriangle, ChevronDown, BatteryCharging } from 'lucide-react';
import MapView from '../components/MapView';
import { VehicleProfile, ChargingStation, TripPlan, LocationPoint, ConnectorType } from '../types';
import { getDemoStations } from '../lib/demoData';
import { calculateRoute, RouteResult } from '../lib/routing';
import { searchLocation } from '../lib/geocoding';
import { calculateRange, canReachDestination, planChargingStops, formatTime, scoreStationForStop, calculateDistanceBetween } from '../lib/calculations';
import { saveTrip, getVehicles } from '../lib/storage';

const defaultVehicle: VehicleProfile = {
  id: 'default',
  name: 'My EV',
  batteryCapacity: 60,
  consumption: 15,
  connector: 'CCS2',
  maxChargingPower: 120,
  targetSoc: 80,
  minimumArrivalSoc: 15,
  currentSoc: 70,
};

export default function Planner() {
  const [origin, setOrigin] = useState<LocationPoint | null>(null);
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [vehicle, setVehicle] = useState<VehicleProfile>(defaultVehicle);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [originResults, setOriginResults] = useState<LocationPoint[]>([]);
  const [destResults, setDestResults] = useState<LocationPoint[]>([]);
  const [planning, setPlanning] = useState(false);
  const [tripResult, setTripResult] = useState<TripPlan | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([75.3433, 19.8762]);
  const [stations, setStations] = useState<ChargingStation[]>([]);

  useEffect(() => {
    setStations(getDemoStations());
    const savedVehicles = getVehicles();
    if (savedVehicles.length > 0) {
      setVehicle(savedVehicles[0]);
    }
  }, []);

  // Search handlers
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (originSearch.length >= 2) {
        try { setOriginResults(await searchLocation(originSearch)); } catch { setOriginResults([]); }
      } else setOriginResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [originSearch]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (destSearch.length >= 2) {
        try { setDestResults(await searchLocation(destSearch)); } catch { setDestResults([]); }
      } else setDestResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [destSearch]);

  const handleGetLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setOrigin({ name, latitude, longitude });
        setOriginSearch(name);
        setMapCenter([longitude, latitude]);
        setLocating(false);
      },
      () => { setError('Location permission denied'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePlanTrip = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    setPlanning(true);
    setError('');
    setTripResult(null);

    try {
      // Calculate route
      const route = await calculateRoute(origin, destination);
      setRouteResult(route);

      // Calculate center for map
      const midLat = (origin.latitude + destination.latitude) / 2;
      const midLng = (origin.longitude + destination.longitude) / 2;
      setMapCenter([midLng, midLat]);

      // Check if charging is needed
      const range = calculateRange(vehicle);
      const needsCharging = !canReachDestination(route.distance, vehicle);

      let chargingStops: import('../types').ChargingStop[] = [];
      if (needsCharging) {
        chargingStops = planChargingStops(
          route.distance,
          vehicle,
          stations,
          route.coordinates
        );
      }

      const totalChargingTime = chargingStops.reduce((sum, s) => sum + s.chargingTime, 0);
      const totalCost = chargingStops.reduce((sum, s) => sum + s.estimatedCost, 0);

      // Calculate arrival SOC
      let arrivalSoc = vehicle.currentSoc;
      if (chargingStops.length > 0) {
        const lastStop = chargingStops[chargingStops.length - 1];
        const distAfterLastStop = route.distance - (lastStop.sequence * route.distance / (chargingStops.length + 1));
        const energyUsed = (distAfterLastStop * vehicle.consumption) / 100;
        const energyAtLastStop = vehicle.batteryCapacity * (lastStop.socOnDeparture / 100);
        arrivalSoc = ((energyAtLastStop - energyUsed) / vehicle.batteryCapacity) * 100;
      } else {
        const energyUsed = (route.distance * vehicle.consumption) / 100;
        const currentEnergy = vehicle.batteryCapacity * (vehicle.currentSoc / 100);
        arrivalSoc = ((currentEnergy - energyUsed) / vehicle.batteryCapacity) * 100;
      }

      const trip: TripPlan = {
        id: Date.now().toString(),
        origin,
        destination,
        vehicle,
        distance: route.distance,
        drivingTime: route.duration,
        chargingStops,
        totalChargingTime,
        estimatedCost: totalCost,
        arrivalSoc: Math.max(0, Math.round(arrivalSoc)),
        routeGeometry: route.geometry,
        createdAt: new Date().toISOString(),
      };

      setTripResult(trip);
      saveTrip(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trip planning failed');
    }

    setPlanning(false);
  };

  const chargingStopMarkers = tripResult?.chargingStops.map(s => ({
    lat: s.station.latitude,
    lng: s.station.longitude,
  }));

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col md:flex-row overflow-hidden">
      {/* Map */}
      <div className="w-full md:w-1/2 h-[35vh] md:h-full relative">
        <MapView
          center={mapCenter}
          zoom={tripResult ? 8 : 6}
          stations={stations}
          userLocation={origin ? { lat: origin.latitude, lng: origin.longitude } : null}
          routeGeometry={routeResult?.geometry || null}
          originPoint={origin ? { lat: origin.latitude, lng: origin.longitude } : null}
          destinationPoint={destination ? { lat: destination.latitude, lng: destination.longitude } : null}
          chargingStops={chargingStopMarkers}
        />
      </div>

      {/* Planner Panel */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Plan Your EV Journey</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your trip details and we'll find the best charging strategy.</p>

        <div className="space-y-4">
          {/* Origin */}
          <div className="relative">
            <label className="text-xs text-slate-400 mb-1 block">From</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
              <input
                type="text"
                value={originSearch}
                onChange={(e) => { setOriginSearch(e.target.value); setOrigin(null); }}
                placeholder="Enter starting location"
                className="w-full pl-10 pr-20 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50"
              />
              <button onClick={handleGetLocation} disabled={locating} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-electric hover:bg-electric/10 rounded-lg">
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
              </button>
            </div>
            {originResults.length > 0 && !origin && (
              <div className="absolute z-20 mt-1 w-full glass-card p-1 max-h-40 overflow-y-auto">
                {originResults.map((r, i) => (
                  <button key={i} onClick={() => { setOrigin(r); setOriginSearch(r.name); setOriginResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-electric/10 rounded-lg truncate">
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="relative">
            <label className="text-xs text-slate-400 mb-1 block">To</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
              <input
                type="text"
                value={destSearch}
                onChange={(e) => { setDestSearch(e.target.value); setDestination(null); }}
                placeholder="Enter destination"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50"
              />
            </div>
            {destResults.length > 0 && !destination && (
              <div className="absolute z-20 mt-1 w-full glass-card p-1 max-h-40 overflow-y-auto">
                {destResults.map((r, i) => (
                  <button key={i} onClick={() => { setDestination(r); setDestSearch(r.name); setDestResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-electric/10 rounded-lg truncate">
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle & Battery */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Current Battery</label>
              <div className="relative">
                <input type="number" value={vehicle.currentSoc} onChange={e => setVehicle(v => ({ ...v, currentSoc: Number(e.target.value) }))}
                  min={0} max={100} className="w-full px-3 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-electric/50" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Battery</label>
              <div className="relative">
                <input type="number" value={vehicle.targetSoc} onChange={e => setVehicle(v => ({ ...v, targetSoc: Number(e.target.value) }))}
                  min={0} max={100} className="w-full px-3 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-electric/50" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-electric">
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            Advanced settings
          </button>

          {showAdvanced && (
            <div className="glass-card p-4 space-y-3 animate-slide-up">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Battery Capacity (kWh)</label>
                  <input type="number" value={vehicle.batteryCapacity} onChange={e => setVehicle(v => ({ ...v, batteryCapacity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Consumption (kWh/100km)</label>
                  <input type="number" value={vehicle.consumption} onChange={e => setVehicle(v => ({ ...v, consumption: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Connector</label>
                  <select value={vehicle.connector} onChange={e => setVehicle(v => ({ ...v, connector: e.target.value as ConnectorType }))}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50">
                    <option value="CCS2">CCS2</option>
                    <option value="Type2">Type 2</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Max Charging Power (kW)</label>
                  <input type="number" value={vehicle.maxChargingPower} onChange={e => setVehicle(v => ({ ...v, maxChargingPower: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Min Arrival SOC (%)</label>
                  <input type="number" value={vehicle.minimumArrivalSoc} onChange={e => setVehicle(v => ({ ...v, minimumArrivalSoc: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
                </div>
              </div>
            </div>
          )}

          {/* Range Info */}
          <div className="glass-card p-3 flex items-center gap-3">
            <Battery className="w-5 h-5 text-electric" />
            <div>
              <p className="text-xs text-slate-400">Estimated Range</p>
              <p className="text-sm font-semibold text-white">{Math.round(calculateRange(vehicle))} km</p>
            </div>
          </div>

          {/* Plan Button */}
          <button
            onClick={handlePlanTrip}
            disabled={planning || !origin || !destination}
            className="w-full py-3 bg-electric text-dark-bg font-semibold rounded-xl hover:bg-lime transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {planning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Planning trip...</>
            ) : (
              <><Route className="w-4 h-4" /> Plan Trip</>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Trip Result */}
        {tripResult && <TripResultView trip={tripResult} />}
      </div>
    </div>
  );
}

function TripResultView({ trip }: { trip: TripPlan }) {
  const needsCharging = trip.chargingStops.length > 0;

  return (
    <div className="mt-6 space-y-4 animate-slide-up">
      <div className="glass-card p-5">
        <h2 className="text-lg font-bold text-white mb-1">Your Trip</h2>
        <p className="text-sm text-slate-400 mb-4">{trip.origin.name} → {trip.destination.name}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={<Route className="w-4 h-4 text-electric" />} label="Distance" value={`${trip.distance.toFixed(0)} km`} />
          <StatCard icon={<Clock className="w-4 h-4 text-electric" />} label="Driving Time" value={formatTime(trip.drivingTime)} />
          <StatCard icon={<BatteryCharging className="w-4 h-4 text-electric" />} label="Charging Time" value={needsCharging ? formatTime(trip.totalChargingTime) : 'None needed'} />
          <StatCard icon={<Zap className="w-4 h-4 text-electric" />} label="Charging Stops" value={`${trip.chargingStops.length}`} />
          <StatCard icon={<Clock className="w-4 h-4 text-electric" />} label="Total Time" value={formatTime(trip.drivingTime + trip.totalChargingTime)} />
          <StatCard icon={<Battery className="w-4 h-4 text-electric" />} label="Arrival Battery" value={`${trip.arrivalSoc}%`} />
        </div>

        {trip.estimatedCost > 0 && (
          <div className="mt-4 p-3 bg-electric/10 rounded-xl">
            <p className="text-sm text-electric font-medium">Estimated charging cost: ₹{trip.estimatedCost}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Trip Timeline</h3>
        <div className="space-y-0">
          <TimelineItem type="start" title={trip.origin.name} subtitle="Start" />
          
          {trip.chargingStops.length === 0 ? (
            <TimelineItem type="drive" title={`${trip.distance.toFixed(0)} km`} subtitle={formatTime(trip.drivingTime)} />
          ) : (
            trip.chargingStops.map((stop, idx) => {
              const prevDist = idx === 0 
                ? calculateDistanceBetween(trip.origin.latitude, trip.origin.longitude, stop.station.latitude, stop.station.longitude)
                : calculateDistanceBetween(trip.chargingStops[idx-1].station.latitude, trip.chargingStops[idx-1].station.longitude, stop.station.latitude, stop.station.longitude);
              const driveTime = (prevDist / trip.distance) * trip.drivingTime;
              
              return (
                <div key={stop.sequence}>
                  <TimelineItem type="drive" title={`${prevDist.toFixed(0)} km`} subtitle={`~${formatTime(driveTime)}`} />
                  <TimelineItem type="charge" title={stop.station.name} subtitle={`${formatTime(stop.chargingTime)} • ${stop.energyAdded.toFixed(1)} kWh • ₹${stop.estimatedCost}`} />
                </div>
              );
            })
          )}
          
          {trip.chargingStops.length > 0 && (
            <TimelineItem 
              type="drive" 
              title={`${(trip.distance - trip.chargingStops.reduce((s, stop) => s + calculateDistanceBetween(trip.origin.latitude, trip.origin.longitude, stop.station.latitude, stop.station.longitude), 0)).toFixed(0)} km`}
              subtitle="Final stretch"
            />
          )}
          
          <TimelineItem type="end" title={trip.destination.name} subtitle="Arrival" />
        </div>
      </div>

      {/* Charging Stop Details */}
      {trip.chargingStops.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recommended Charging Stops</h3>
          {trip.chargingStops.map(stop => {
            const reasons = scoreStationForStop(stop.station, trip.vehicle, 2, stop.energyAdded).reasons;
            return (
              <div key={stop.sequence} className="mb-4 last:mb-0 p-3 bg-dark-surface rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-electric/20 text-electric text-xs flex items-center justify-center font-bold">{stop.sequence}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{stop.station.name}</p>
                    <p className="text-xs text-slate-500">{stop.station.power} kW • {stop.station.connectors.join(', ')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <span className="text-slate-400">Time: <span className="text-white">{formatTime(stop.chargingTime)}</span></span>
                  <span className="text-slate-400">Energy: <span className="text-white">{stop.energyAdded.toFixed(1)} kWh</span></span>
                  <span className="text-slate-400">Cost: <span className="text-white">₹{stop.estimatedCost}</span></span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {reasons.map((r, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-electric/10 text-electric">{r}</span>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-slate-600 mt-2">* Charging times are estimates. Actual times vary based on battery temperature, charging curve, and station conditions.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({ type, title, subtitle }: { type: 'start' | 'drive' | 'charge' | 'end'; title: string; subtitle: string }) {
  const colors = {
    start: 'bg-green-500',
    drive: 'bg-blue-500',
    charge: 'bg-yellow-500',
    end: 'bg-red-500',
  };

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${colors[type]}`} />
        <div className="w-0.5 h-6 bg-dark-border mt-1" />
      </div>
      <div>
        <p className="text-xs font-medium text-white">{title}</p>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

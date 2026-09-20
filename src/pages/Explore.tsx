import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Zap, Star, MapPin, Navigation, X, ArrowUpDown, Bookmark, BookmarkCheck, BarChart3, Loader2 } from 'lucide-react';
import MapView from '../components/MapView';
import { ChargingStation, FilterState, SortOption, ConnectorType } from '../types';
import { getDemoStations, getDemoStationsNearby } from '../lib/demoData';
import { calculateDistanceBetween, getStationAvailability, formatDistance, isStationCompatible } from '../lib/calculations';
import { searchLocation } from '../lib/geocoding';
import { isStationSaved, saveStation, removeSavedStation } from '../lib/storage';

export default function Explore() {
  const [searchParams] = useSearchParams();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<ChargingStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([75.3433, 19.8762]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; latitude: number; longitude: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [showCompare, setShowCompare] = useState(false);
  const [compareList, setCompareList] = useState<ChargingStation[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');

  const [filters, setFilters] = useState<FilterState>({
    maxDistance: null,
    connector: null,
    minPower: null,
    availability: 'any',
    openNow: false,
  });

  // Load stations
  useEffect(() => {
    const allStations = getDemoStations();
    setStations(allStations);
    setFilteredStations(allStations);
    setSaved(new Set());
    setLoading(false);
  }, []);

  // Check useLocation param
  useEffect(() => {
    if (searchParams.get('useLocation') === 'true') {
      handleGetLocation();
    }
  }, [searchParams]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...stations];

    // Apply distance filter
    if (filters.maxDistance && userLocation) {
      result = result.filter(s =>
        calculateDistanceBetween(userLocation.lat, userLocation.lng, s.latitude, s.longitude) <= filters.maxDistance!
      );
    }

    // Apply connector filter
    if (filters.connector) {
      result = result.filter(s => s.connectors.includes(filters.connector!));
    }

    // Apply power filter
    if (filters.minPower) {
      result = result.filter(s => s.power >= filters.minPower!);
    }

    // Apply availability filter
    if (filters.availability === 'available') {
      result = result.filter(s => s.availableChargers > 0);
    }

    // Apply open filter
    if (filters.openNow) {
      result = result.filter(s => s.isOpen24h);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'nearest':
          if (!userLocation) return 0;
          return calculateDistanceBetween(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
            - calculateDistanceBetween(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        case 'fastest':
          return b.power - a.power;
        case 'cheapest':
          return (a.pricePerKwh || 999) - (b.pricePerKwh || 999);
        case 'availability':
          return b.availableChargers - a.availableChargers;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    setFilteredStations(result);
  }, [stations, filters, sortBy, userLocation]);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchLocation(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleSelectSearchResult = (result: { name: string; latitude: number; longitude: number }) => {
    setMapCenter([result.longitude, result.latitude]);
    setSearchQuery(result.name);
    setSearchResults([]);
    // Load nearby stations
    const nearby = getDemoStationsNearby(result.latitude, result.longitude, 100);
    setStations(nearby.length > 0 ? nearby : getDemoStations());
  };

  const handleGetLocation = () => {
    setLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter([loc.lng, loc.lat]);
        const nearby = getDemoStationsNearby(loc.lat, loc.lng, 100);
        setStations(nearby.length > 0 ? nearby : getDemoStations());
        setLocating(false);
      },
      (err) => {
        setLocationError(err.code === 1 ? 'Permission denied' : 'Location unavailable');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStationClick = (station: ChargingStation) => {
    setSelectedStation(station);
    setShowDetails(true);
  };

  const handleSaveStation = (station: ChargingStation) => {
    if (saved.has(station.id)) {
      removeSavedStation(station.id);
      setSaved(prev => { const n = new Set(prev); n.delete(station.id); return n; });
    } else {
      saveStation({ id: station.id, stationId: station.id, station, savedAt: new Date().toISOString() });
      setSaved(prev => { const n = new Set(prev); n.add(station.id); return n; });
    }
  };

  const handleToggleCompare = (station: ChargingStation) => {
    setCompareList(prev => {
      if (prev.find(s => s.id === station.id)) {
        return prev.filter(s => s.id !== station.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, station];
    });
  };

  const getDistance = (station: ChargingStation): string => {
    if (!userLocation) return 'N/A';
    return formatDistance(calculateDistanceBetween(userLocation.lat, userLocation.lng, station.latitude, station.longitude));
  };

  return (
    <div className="h-[calc(100vh-57px)] md:h-[calc(100vh-57px)] flex flex-col md:flex-row">
      {/* Map Section */}
      <div className="w-full md:w-1/2 h-[40vh] md:h-full relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-dark-card">
            <Loader2 className="w-8 h-8 text-electric animate-spin" />
          </div>
        ) : (
          <MapView
            center={mapCenter}
            stations={filteredStations}
            selectedStationId={selectedStation?.id}
            userLocation={userLocation}
            onStationClick={handleStationClick}
            onMapClick={() => setShowDetails(false)}
          />
        )}
        
        {/* Map overlay controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <button
            onClick={handleGetLocation}
            disabled={locating}
            className="glass-card p-2.5 hover:border-electric/30 transition-all"
            aria-label="Use my location"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 text-electric animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-electric" />
            )}
          </button>
        </div>
      </div>

      {/* Panel Section */}
      <div className="flex-1 flex flex-col overflow-hidden bg-dark-bg">
        {/* Search & Filters */}
        <div className="p-4 border-b border-dark-border space-y-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-electric animate-spin" />}
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-30 left-0 right-0 top-full mt-1 glass-card p-1 max-h-48 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-electric/10 hover:text-white rounded-lg transition-colors truncate"
                  >
                    <MapPin className="w-3 h-3 inline mr-2 text-electric" />
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                showFilters ? 'bg-electric/15 text-electric border border-electric/30' : 'bg-dark-surface text-slate-400 border border-dark-border hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <div className="flex-1" />
            <div className="relative">
              <button
                onClick={() => {
                  const opts: SortOption[] = ['nearest', 'fastest', 'cheapest', 'availability', 'rating'];
                  const idx = opts.indexOf(sortBy);
                  setSortBy(opts[(idx + 1) % opts.length]);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-dark-surface text-slate-400 border border-dark-border hover:text-white transition-all"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </button>
            </div>
            {compareList.length > 0 && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-electric/15 text-electric border border-electric/30"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Compare ({compareList.length})
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="glass-card p-4 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Filters</span>
                <button onClick={() => setFilters({ maxDistance: null, connector: null, minPower: null, availability: 'any', openNow: false })} className="text-xs text-electric">Reset</button>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Distance</label>
                <div className="flex flex-wrap gap-1.5">
                  {[null, 5, 10, 25].map(d => (
                    <button key={d ?? 'any'} onClick={() => setFilters(f => ({ ...f, maxDistance: d }))}
                      className={`px-2.5 py-1 rounded-md text-xs ${filters.maxDistance === d ? 'bg-electric/20 text-electric' : 'bg-dark-surface text-slate-400'}`}>
                      {d ? `${d} km` : 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Connector</label>
                <div className="flex flex-wrap gap-1.5">
                  {[null, 'CCS2', 'Type2', 'CHAdeMO'].map(c => (
                    <button key={c ?? 'any'} onClick={() => setFilters(f => ({ ...f, connector: c as ConnectorType | null }))}
                      className={`px-2.5 py-1 rounded-md text-xs ${filters.connector === c ? 'bg-electric/20 text-electric' : 'bg-dark-surface text-slate-400'}`}>
                      {c || 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Power</label>
                <div className="flex flex-wrap gap-1.5">
                  {[null, 30, 60, 100, 150].map(p => (
                    <button key={p ?? 'any'} onClick={() => setFilters(f => ({ ...f, minPower: p }))}
                      className={`px-2.5 py-1 rounded-md text-xs ${filters.minPower === p ? 'bg-electric/20 text-electric' : 'bg-dark-surface text-slate-400'}`}>
                      {p ? `${p}+ kW` : 'Any'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={filters.availability === 'available'} onChange={e => setFilters(f => ({ ...f, availability: e.target.checked ? 'available' : 'any' }))} className="rounded border-dark-border" />
                  Available only
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={filters.openNow} onChange={e => setFilters(f => ({ ...f, openNow: e.target.checked }))} className="rounded border-dark-border" />
                  Open now
                </label>
              </div>
            </div>
          )}

          {locationError && <p className="text-xs text-red-400">{locationError}</p>}
        </div>

        {/* Station List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">{filteredStations.length} stations found</span>
            <span className="text-xs text-slate-600">Demo data</span>
          </div>

          {filteredStations.map(station => {
            const availability = getStationAvailability(station);
            const isSaved = saved.has(station.id);
            const isComparing = compareList.some(s => s.id === station.id);

            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`glass-card glass-card-hover p-4 cursor-pointer transition-all ${
                  selectedStation?.id === station.id ? 'border-electric/40 ring-1 ring-electric/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{station.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{station.operator}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveStation(station); }}
                      className="p-1.5 rounded-lg hover:bg-white/5"
                      aria-label={isSaved ? 'Unsave station' : 'Save station'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-electric" /> : <Bookmark className="w-4 h-4 text-slate-500" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleCompare(station); }}
                      className={`p-1.5 rounded-lg hover:bg-white/5 ${isComparing ? 'text-electric' : ''}`}
                      aria-label="Compare"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center gap-1 text-xs text-electric font-medium">
                    <Zap className="w-3 h-3" /> {station.power} kW
                  </span>
                  <span className="text-xs text-slate-500">
                    {station.connectors.join(' • ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      availability === 'available' ? 'bg-green-500/20 text-green-400' :
                      availability === 'limited' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {station.availableChargers}/{station.totalChargers}
                    </span>
                    {station.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                        <Star className="w-3 h-3" /> {station.rating}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {station.pricePerKwh && <span>₹{station.pricePerKwh}/kWh</span>}
                    <span>{getDistance(station)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No stations match your filters</p>
              <button onClick={() => setFilters({ maxDistance: null, connector: null, minPower: null, availability: 'any', openNow: false })} className="text-xs text-electric mt-2">Reset filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Station Details Modal */}
      {showDetails && selectedStation && (
        <StationDetails
          station={selectedStation}
          distance={getDistance(selectedStation)}
          isSaved={saved.has(selectedStation.id)}
          onClose={() => setShowDetails(false)}
          onSave={() => handleSaveStation(selectedStation)}
          onCompare={() => handleToggleCompare(selectedStation)}
        />
      )}

      {/* Compare Modal */}
      {showCompare && compareList.length > 0 && (
        <CompareModal
          stations={compareList}
          userLocation={userLocation}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => setCompareList(prev => prev.filter(s => s.id !== id))}
        />
      )}
    </div>
  );
}

// Station Details Component
function StationDetails({ station, distance, isSaved, onClose, onSave, onCompare }: {
  station: ChargingStation;
  distance: string;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  onCompare: () => void;
}) {
  const availability = getStationAvailability(station);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="w-full md:max-w-lg glass-card p-6 rounded-b-none md:rounded-2xl max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{station.name}</h2>
            <p className="text-sm text-slate-400">{station.operator}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-electric font-bold text-xl">
              <Zap className="w-5 h-5" /> {station.power} kW
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              availability === 'available' ? 'bg-green-500/20 text-green-400' :
              availability === 'limited' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {station.availableChargers}/{station.totalChargers} available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Connectors" value={station.connectors.join(', ')} />
            <InfoItem label="Distance" value={distance} />
            <InfoItem label="Price" value={station.pricePerKwh ? `₹${station.pricePerKwh}/kWh` : 'Unavailable'} />
            <InfoItem label="Hours" value={station.openingHours} />
            {station.rating && <InfoItem label="Rating" value={`${station.rating} / 5`} />}
            <InfoItem label="Status" value={station.isOpen24h ? 'Open 24h' : 'Limited hours'} />
          </div>

          <div className="text-xs text-slate-600 space-y-0.5">
            <p>Address: {station.address}</p>
            <p>Data source: {station.dataSource} • Last updated: {new Date(station.lastUpdated).toLocaleDateString()}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onSave} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isSaved ? 'bg-electric/20 text-electric border border-electric/30' : 'bg-dark-surface text-slate-300 border border-dark-border hover:border-electric/30'
            }`}>
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button onClick={onCompare} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-dark-surface text-slate-300 border border-dark-border hover:border-electric/30 transition-all">
              <BarChart3 className="w-4 h-4" />
              Compare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}

// Compare Modal
function CompareModal({ stations, userLocation, onClose, onRemove }: {
  stations: ChargingStation[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const getDist = (s: ChargingStation) => {
    if (!userLocation) return 'N/A';
    return formatDistance(calculateDistanceBetween(userLocation.lat, userLocation.lng, s.latitude, s.longitude));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4" onClick={onClose}>
      <div className="w-full max-w-2xl glass-card p-6 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Compare Stations</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-2 px-2 text-xs text-slate-500">Feature</th>
                {stations.map(s => (
                  <th key={s.id} className="text-left py-2 px-2 text-xs text-white">
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[100px]">{s.name}</span>
                      <button onClick={() => onRemove(s.id)} className="text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/50">
              <tr><td className="py-2 px-2 text-slate-500">Distance</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-white">{getDist(s)}</td>)}</tr>
              <tr><td className="py-2 px-2 text-slate-500">Power</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-electric">{s.power} kW</td>)}</tr>
              <tr><td className="py-2 px-2 text-slate-500">Connector</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-white">{s.connectors.join(', ')}</td>)}</tr>
              <tr><td className="py-2 px-2 text-slate-500">Availability</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-white">{s.availableChargers}/{s.totalChargers}</td>)}</tr>
              <tr><td className="py-2 px-2 text-slate-500">Price</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-white">{s.pricePerKwh ? `₹${s.pricePerKwh}/kWh` : 'N/A'}</td>)}</tr>
              <tr><td className="py-2 px-2 text-slate-500">Rating</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-white">{s.rating || 'N/A'}</td>)}</tr>
              <tr><td className="py-2 px-2 text-slate-500">Hours</td>{stations.map(s => <td key={s.id} className="py-2 px-2 text-white">{s.openingHours}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

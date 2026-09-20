import { useState, useEffect } from 'react';
import { Heart, Zap, Star, Trash2, Bookmark } from 'lucide-react';
import { SavedStation, ChargingStation } from '../types';
import { getSavedStations, removeSavedStation } from '../lib/storage';
import { getStationAvailability } from '../lib/calculations';

export default function Saved() {
  const [savedStations, setSavedStations] = useState<SavedStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  useEffect(() => {
    setSavedStations(getSavedStations());
  }, []);

  const handleRemove = (stationId: string) => {
    removeSavedStation(stationId);
    setSavedStations(prev => prev.filter(s => s.stationId !== stationId));
  };

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-electric/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-electric" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Saved Stations</h1>
            <p className="text-xs text-slate-400">{savedStations.length} stations saved</p>
          </div>
        </div>

        {savedStations.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No saved stations</h3>
            <p className="text-sm text-slate-500">Save charging stations from the Explore page to quickly access them later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedStations.map(saved => {
              const station = saved.station;
              const availability = getStationAvailability(station);
              
              return (
                <div key={saved.id} className="glass-card glass-card-hover p-4 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{station.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{station.operator} • {station.address}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(saved.stationId)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      aria-label="Remove station"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center gap-1 text-xs text-electric font-medium">
                      <Zap className="w-3 h-3" /> {station.power} kW
                    </span>
                    <span className="text-xs text-slate-500">{station.connectors.join(' • ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      availability === 'available' ? 'bg-green-500/20 text-green-400' :
                      availability === 'limited' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {station.availableChargers}/{station.totalChargers}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {station.pricePerKwh && <span>₹{station.pricePerKwh}/kWh</span>}
                      {station.rating && (
                        <span className="flex items-center gap-0.5 text-yellow-400">
                          <Star className="w-3 h-3" /> {station.rating}
                        </span>
                      )}
                      <span>{station.isOpen24h ? 'Open 24h' : station.openingHours}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

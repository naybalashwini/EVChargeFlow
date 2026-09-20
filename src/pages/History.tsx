import { useState, useEffect } from 'react';
import { History, Route, Clock, Zap, Battery, Trash2, Calendar, MapPin } from 'lucide-react';
import { TripPlan } from '../types';
import { getTrips, deleteTrip } from '../lib/storage';
import { formatTime } from '../lib/calculations';

export default function TripHistory() {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripPlan | null>(null);

  useEffect(() => {
    setTrips(getTrips());
  }, []);

  const handleDelete = (id: string) => {
    deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
    if (selectedTrip?.id === id) setSelectedTrip(null);
  };

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-electric/20 flex items-center justify-center">
            <History className="w-5 h-5 text-electric" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trip History</h1>
            <p className="text-xs text-slate-400">{trips.length} trips recorded</p>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16">
            <Route className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No trips yet</h3>
            <p className="text-sm text-slate-500">Plan your first trip to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <div key={trip.id} className="glass-card glass-card-hover p-4 transition-all cursor-pointer" onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-white font-medium">
                      <MapPin className="w-3 h-3 text-green-400 shrink-0" />
                      <span className="truncate">{trip.origin.name}</span>
                      <span className="text-slate-500">→</span>
                      <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate">{trip.destination.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Delete trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-1.5">
                    <Route className="w-3 h-3 text-electric" />
                    <span className="text-xs text-slate-400">{trip.distance.toFixed(0)} km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-electric" />
                    <span className="text-xs text-slate-400">{formatTime(trip.drivingTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-electric" />
                    <span className="text-xs text-slate-400">{trip.chargingStops.length} stops</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Battery className="w-3 h-3 text-electric" />
                    <span className="text-xs text-slate-400">{trip.arrivalSoc}% arrival</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTrip?.id === trip.id && (
                  <div className="mt-4 pt-3 border-t border-dark-border animate-slide-up">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Driving Time</span>
                        <p className="text-white">{formatTime(trip.drivingTime)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Charging Time</span>
                        <p className="text-white">{trip.totalChargingTime > 0 ? formatTime(trip.totalChargingTime) : 'None'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Time</span>
                        <p className="text-white">{formatTime(trip.drivingTime + trip.totalChargingTime)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Estimated Cost</span>
                        <p className="text-white">{trip.estimatedCost > 0 ? `₹${trip.estimatedCost}` : 'N/A'}</p>
                      </div>
                    </div>
                    {trip.chargingStops.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-2">Charging Stops:</p>
                        {trip.chargingStops.map(stop => (
                          <div key={stop.sequence} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                            <span className="w-4 h-4 rounded-full bg-electric/20 text-electric text-[10px] flex items-center justify-center">{stop.sequence}</span>
                            <span>{stop.station.name}</span>
                            <span className="text-slate-500">({formatTime(stop.chargingTime)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

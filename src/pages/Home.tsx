import { useNavigate } from 'react-router-dom';
import { Zap, MapPin, Route, Navigation, Battery, Shield } from 'lucide-react';
import { useState } from 'react';
import { reverseGeocode } from '../lib/geocoding';

export default function Home() {
  const navigate = useNavigate();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleUseLocation = () => {
    setLocating(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const name = await reverseGeocode(latitude, longitude);
        sessionStorage.setItem('userLocation', JSON.stringify({ name, latitude, longitude }));
        navigate('/explore?useLocation=true');
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access or search manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An error occurred while getting your location.');
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-electric/20 flex items-center justify-center">
            <Zap className="w-8 h-8 text-electric" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Charge<span className="text-electric">Flow</span>
          </h1>
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-bold text-center text-white mb-4 max-w-3xl leading-tight">
          Charge smarter.<br />
          <span className="text-electric">Travel farther.</span>
        </h2>

        <p className="text-lg md:text-xl text-slate-400 text-center max-w-2xl mb-10">
          Find EV chargers, compare charging options, and plan your journey with confidence.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/explore')}
            className="w-full sm:w-auto px-8 py-4 bg-electric text-dark-bg font-semibold rounded-xl hover:bg-lime transition-all hover:shadow-lg hover:shadow-electric/20 flex items-center justify-center gap-2"
          >
            <MapPin className="w-5 h-5" />
            Find Chargers
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="w-full sm:w-auto px-8 py-4 bg-dark-surface border border-dark-border text-white font-semibold rounded-xl hover:border-electric/30 transition-all flex items-center justify-center gap-2"
          >
            <Route className="w-5 h-5" />
            Plan a Trip
          </button>
        </div>

        {/* Use Location */}
        <button
          onClick={handleUseLocation}
          disabled={locating}
          className="flex items-center gap-2 text-slate-400 hover:text-electric transition-colors text-sm"
        >
          {locating ? (
            <div className="w-4 h-4 border-2 border-electric border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {locating ? 'Detecting location...' : 'Use my location'}
        </button>

        {locationError && (
          <p className="mt-3 text-sm text-red-400 text-center max-w-md">{locationError}</p>
        )}
      </div>

      {/* Features Section */}
      <div className="px-4 py-12 md:py-16 border-t border-dark-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MapPin className="w-6 h-6 text-electric" />}
            title="Find Chargers"
            description="Discover nearby EV charging stations with real-time availability, pricing, and connector information."
          />
          <FeatureCard
            icon={<Route className="w-6 h-6 text-electric" />}
            title="Plan Trips"
            description="Calculate range, find optimal charging stops, and get detailed trip planning with cost estimates."
          />
          <FeatureCard
            icon={<Battery className="w-6 h-6 text-electric" />}
            title="Smart Calculations"
            description="Accurate range estimation, charging time calculation, and intelligent stop recommendations."
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-dark-border text-center">
        <p className="text-sm text-slate-500">
          <Shield className="w-3 h-3 inline mr-1" />
          ChargeFlow — EV Charging Intelligence & Trip Planner
        </p>
        <p className="text-xs text-slate-600 mt-1">Demo Mode • Sample data for demonstration</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card glass-card-hover p-6 transition-all">
      <div className="w-12 h-12 rounded-xl bg-electric/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Car, Save, Zap, Battery, Plug, Settings, Shield, Loader2 } from 'lucide-react';
import { VehicleProfile, ConnectorType } from '../types';
import { getUser, saveUser, removeUser, getVehicles, saveVehicle, deleteVehicle } from '../lib/storage';

export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<VehicleProfile | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setIsLoggedIn(true);
      setName(user.name);
      setEmail(user.email);
    }
    setVehicles(getVehicles());
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    // Demo authentication (simulates Supabase auth)
    setTimeout(() => {
      if (authMode === 'signup') {
        if (!email || !password || !name) {
          setAuthError('Please fill all fields');
          setAuthLoading(false);
          return;
        }
        if (password.length < 6) {
          setAuthError('Password must be at least 6 characters');
          setAuthLoading(false);
          return;
        }
        const user = { id: Date.now().toString(), email, name };
        saveUser(user);
        setIsLoggedIn(true);
      } else {
        if (!email || !password) {
          setAuthError('Please enter email and password');
          setAuthLoading(false);
          return;
        }
        const user = { id: 'demo-user', email, name: email.split('@')[0] };
        saveUser(user);
        setIsLoggedIn(true);
        setName(user.name);
      }
      setAuthLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    removeUser();
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSaveVehicle = (vehicle: VehicleProfile) => {
    setSaving(true);
    setTimeout(() => {
      saveVehicle(vehicle);
      setVehicles(getVehicles());
      setEditingVehicle(null);
      setShowVehicleForm(false);
      setSaving(false);
    }, 500);
  };

  const handleDeleteVehicle = (id: string) => {
    deleteVehicle(id);
    setVehicles(getVehicles());
  };

  if (!isLoggedIn) {
    return (
      <div className="h-[calc(100vh-57px)] overflow-y-auto flex items-center justify-center p-4 pb-24 md:pb-6">
        <div className="w-full max-w-md">
          <div className="glass-card p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-electric/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-electric" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-sm text-slate-400">
                {authMode === 'login' ? 'Sign in to access your data' : 'Join ChargeFlow to save trips and stations'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50"
                />
              </div>

              {authError && (
                <p className="text-sm text-red-400">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-electric text-dark-bg font-semibold rounded-xl hover:bg-lime transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
                ) : (
                  <><LogIn className="w-4 h-4" /> {authMode === 'login' ? 'Sign In' : 'Create Account'}</>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                className="text-sm text-electric hover:underline"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-border">
              <p className="text-[10px] text-slate-600 text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Demo mode — data stored locally in your browser
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-electric/20 flex items-center justify-center">
                <User className="w-6 h-6 text-electric" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{name || 'User'}</h2>
                <p className="text-xs text-slate-400">{email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Vehicle Profile Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-electric" />
              <h2 className="text-lg font-bold text-white">My EV Profile</h2>
            </div>
            <button
              onClick={() => { setEditingVehicle(null); setShowVehicleForm(true); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-electric/15 text-electric hover:bg-electric/25 transition-colors"
            >
              + Add Vehicle
            </button>
          </div>

          {vehicles.length === 0 && !showVehicleForm ? (
            <div className="glass-card p-8 text-center">
              <Car className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No vehicles added yet</p>
              <p className="text-xs text-slate-500 mt-1">Add your EV to get personalized trip planning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(v => (
                <div key={v.id} className="glass-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{v.name}</h3>
                      <p className="text-xs text-slate-500">{v.batteryCapacity} kWh • {v.consumption} kWh/100km</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingVehicle(v); setShowVehicleForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteVehicle(v.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400">
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-electric/10 text-electric">{v.connector}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-surface text-slate-400">{v.maxChargingPower} kW max</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-surface text-slate-400">Target: {v.targetSoc}%</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dark-surface text-slate-400">Min arrival: {v.minimumArrivalSoc}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle Form */}
          {showVehicleForm && (
            <VehicleForm
              vehicle={editingVehicle}
              onSave={handleSaveVehicle}
              onCancel={() => { setShowVehicleForm(false); setEditingVehicle(null); }}
              saving={saving}
            />
          )}
        </div>

        {/* App Info */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">About ChargeFlow</h3>
          <div className="space-y-2 text-xs text-slate-400">
            <p>Version 1.0.0 — Demo Mode</p>
            <p>EV Charging Intelligence & Trip Planner</p>
            <p className="text-slate-500">Built with React, TypeScript, MapLibre GL JS, Tailwind CSS</p>
            <p className="text-slate-500">Data: Demo stations for demonstration purposes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleForm({ vehicle, onSave, onCancel, saving }: {
  vehicle: VehicleProfile | null;
  onSave: (v: VehicleProfile) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<VehicleProfile>(vehicle || {
    id: Date.now().toString(),
    name: '',
    batteryCapacity: 60,
    consumption: 15,
    connector: 'CCS2',
    maxChargingPower: 120,
    targetSoc: 80,
    minimumArrivalSoc: 15,
    currentSoc: 70,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 mt-3 animate-slide-up">
      <h3 className="text-sm font-semibold text-white mb-4">{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Vehicle Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Tesla Model 3" className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-electric/50" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Battery Capacity (kWh)</label>
            <input type="number" value={form.batteryCapacity} onChange={e => setForm(f => ({ ...f, batteryCapacity: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Consumption (kWh/100km)</label>
            <input type="number" value={form.consumption} onChange={e => setForm(f => ({ ...f, consumption: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Connector</label>
            <select value={form.connector} onChange={e => setForm(f => ({ ...f, connector: e.target.value as ConnectorType }))}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50">
              <option value="CCS2">CCS2</option>
              <option value="Type2">Type 2</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Type1">Type 1</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Max Charging Power (kW)</label>
            <input type="number" value={form.maxChargingPower} onChange={e => setForm(f => ({ ...f, maxChargingPower: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Default Target SOC (%)</label>
            <input type="number" value={form.targetSoc} onChange={e => setForm(f => ({ ...f, targetSoc: Number(e.target.value) }))}
              min={0} max={100} className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Min Arrival SOC (%)</label>
            <input type="number" value={form.minimumArrivalSoc} onChange={e => setForm(f => ({ ...f, minimumArrivalSoc: Number(e.target.value) }))}
              min={0} max={100} className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-electric/50" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving || !form.name}
            className="flex-1 py-2.5 bg-electric text-dark-bg font-medium rounded-xl hover:bg-lime transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Vehicle'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 bg-dark-surface border border-dark-border text-slate-400 rounded-xl hover:text-white transition-all text-sm">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

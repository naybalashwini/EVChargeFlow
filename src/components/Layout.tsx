import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Route, Heart, History, User, Menu, X, Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/planner', label: 'Trip Planner', icon: Route },
  { path: '/saved', label: 'Saved', icon: Heart },
  { path: '/history', label: 'History', icon: History },
  { path: '/account', label: 'Account', icon: User },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-dark-border bg-dark-bg/90 backdrop-blur-lg sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-electric/20 flex items-center justify-center group-hover:bg-electric/30 transition-colors">
            <Zap className="w-5 h-5 text-electric" />
          </div>
          <span className="text-lg font-bold text-white">Charge<span className="text-electric">Flow</span></span>
        </button>

        <nav className="flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-electric/15 text-electric'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-bg/90 backdrop-blur-lg sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-electric/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-electric" />
          </div>
          <span className="text-base font-bold text-white">Charge<span className="text-electric">Flow</span></span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-dark-card border-b border-dark-border z-40 animate-slide-up">
          <nav className="flex flex-col p-2">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-electric/15 text-electric'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card/95 backdrop-blur-lg border-t border-dark-border z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                isActive(item.path)
                  ? 'text-electric'
                  : 'text-slate-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
